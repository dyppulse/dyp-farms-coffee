import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentAttemptStatus,
  PaymentMethod,
  ShopOrderStatus,
  TransactionProvider,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { PaymentEvent } from '@dyp/payments';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsBridgeService } from '../payments-bridge/payments-bridge.service';
import { MailService } from '../notifications/mail.service';
import { StoreService } from '../common/data/store.service';
import { CreateOrderDto } from './dto/create-order.dto';

const ORDER_EXPIRY_MINUTES = 15;
const SHIPPING_FEE_UGX = 15000;

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private payments: PaymentsBridgeService,
    private mail: MailService,
    private store: StoreService,
  ) {}

  findByUser(userId: string) {
    return this.prisma.shopOrder.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId: string) {
    const order = await this.prisma.shopOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        paymentAttempts: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException();
    return order;
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    if (dto.deliveryMethod === 'shipping' && !dto.deliveryAddress) {
      throw new BadRequestException(
        'Delivery address is required for shipping',
      );
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });

    const lineItems = dto.items.map((input) => {
      const product = products.find((p) => p.id === input.productId);
      if (!product) {
        throw new BadRequestException(
          `Product ${input.productId} is unavailable`,
        );
      }
      if (input.quantity < product.minOrderQty) {
        throw new BadRequestException(
          `${product.name} requires a minimum order of ${product.minOrderQty}`,
        );
      }
      return {
        product,
        quantity: input.quantity,
        unitPrice: product.priceUgx,
        lineTotal: product.priceUgx * input.quantity,
      };
    });

    const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const deliveryFee =
      dto.deliveryMethod === 'shipping' ? SHIPPING_FEE_UGX : 0;
    const totalAmount = subtotal + deliveryFee;
    const expiresAt = new Date(Date.now() + ORDER_EXPIRY_MINUTES * 60 * 1000);

    const order = await this.prisma.shopOrder.create({
      data: {
        userId,
        channel: dto.channel,
        status: ShopOrderStatus.pending_payment,
        subtotal,
        deliveryFee,
        totalAmount,
        deliveryMethod: dto.deliveryMethod,
        deliveryAddress: dto.deliveryAddress,
        paymentMethod: dto.paymentMethod,
        paymentPhone: dto.phoneNumber,
        expiresAt,
        items: {
          create: lineItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    const providerMap: Record<PaymentMethod, TransactionProvider> = {
      mtn_momo: TransactionProvider.mtn_momo,
      airtel_money: TransactionProvider.airtel_money,
    };

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        shopOrderId: order.id,
        type: TransactionType.shop_order,
        provider: providerMap[dto.paymentMethod],
        amount: -totalAmount,
        currency: order.currency,
        status: TransactionStatus.pending,
        description: `Dyp Farms shop order — ${lineItems.length} item(s)`,
      },
    });

    let paymentResult;
    try {
      paymentResult = await this.payments.collect({
        method: dto.paymentMethod,
        money: { amount: totalAmount, currency: order.currency },
        payerPhone: dto.phoneNumber,
        reference: order.id,
        description: 'Dyp Farms: shop order',
      });
    } catch (err) {
      await this.prisma.shopOrder.update({
        where: { id: order.id },
        data: { status: ShopOrderStatus.cancelled },
      });
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.failed },
      });
      throw new BadRequestException(
        `Payment initiation failed: ${(err as Error).message}`,
      );
    }

    await this.prisma.orderPaymentAttempt.create({
      data: {
        orderId: order.id,
        provider: dto.paymentMethod,
        phoneNumber: dto.phoneNumber,
        amount: totalAmount,
        currency: order.currency,
        providerReference: paymentResult.providerReference,
        status: PaymentAttemptStatus.pending,
        rawResponse: paymentResult.raw as object,
      },
    });

    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { externalReference: paymentResult.providerReference },
    });

    return {
      orderId: order.id,
      totalAmount,
      currency: order.currency,
      paymentStatus: paymentResult.status,
      providerReference: paymentResult.providerReference,
      expiresAt,
    };
  }

  async onPaymentEvent(event: PaymentEvent) {
    const order = await this.prisma.shopOrder.findUnique({
      where: { id: event.merchantReference },
      include: { items: { include: { product: true } } },
    });
    if (!order) return;
    if (order.status === ShopOrderStatus.confirmed) return;

    const attempt = await this.prisma.orderPaymentAttempt.findFirst({
      where: {
        orderId: order.id,
        providerReference: event.providerReference,
      },
    });

    if (event.status === 'successful') {
      await this.prisma.$transaction(async (tx) => {
        await tx.shopOrder.update({
          where: { id: order.id },
          data: {
            status: ShopOrderStatus.confirmed,
            confirmedAt: new Date(),
          },
        });

        if (attempt) {
          await tx.orderPaymentAttempt.update({
            where: { id: attempt.id },
            data: { status: PaymentAttemptStatus.successful },
          });
        }

        await tx.transaction.updateMany({
          where: { shopOrderId: order.id },
          data: { status: TransactionStatus.completed },
        });
      });

      const user = this.store.findUserById(order.userId);
      if (user?.email) {
        await this.mail.sendOrderConfirmation(user.email, {
          userName: user.name,
          order,
          items: order.items,
        });
      }
    } else if (event.status === 'failed' || event.status === 'expired') {
      await this.releaseOrder(order.id, event.status);
    }
  }

  async releaseOrder(orderId: string, reason: string) {
    const order = await this.prisma.shopOrder.findUnique({
      where: { id: orderId },
    });
    if (!order || order.status !== ShopOrderStatus.pending_payment) return;

    await this.prisma.shopOrder.update({
      where: { id: orderId },
      data: {
        status:
          reason === 'expired'
            ? ShopOrderStatus.expired
            : ShopOrderStatus.cancelled,
      },
    });

    await this.prisma.transaction.updateMany({
      where: { shopOrderId: orderId },
      data: { status: TransactionStatus.failed },
    });

    await this.prisma.orderPaymentAttempt.updateMany({
      where: { orderId },
      data: { status: PaymentAttemptStatus.failed },
    });
  }

  async expirePendingOrders() {
    const expired = await this.prisma.shopOrder.findMany({
      where: {
        status: ShopOrderStatus.pending_payment,
        expiresAt: { lt: new Date() },
      },
    });
    for (const order of expired) {
      await this.releaseOrder(order.id, 'expired');
    }
    return expired.length;
  }

  async pollPaymentStatus(orderId: string, userId: string) {
    const order = await this.findById(orderId, userId);
    if (order.status !== ShopOrderStatus.pending_payment) return order;

    const attempt = order.paymentAttempts[0];
    if (!attempt?.providerReference) return order;

    try {
      const result = await this.payments.verify(
        order.paymentMethod,
        attempt.providerReference,
      );
      if (result.status === 'successful' || result.status === 'failed') {
        await this.onPaymentEvent({
          method: order.paymentMethod,
          providerReference: attempt.providerReference,
          merchantReference: order.id,
          status: result.status,
          money: { amount: order.totalAmount, currency: order.currency },
          occurredAt: new Date(),
        });
      }
    } catch {
      // Provider check may fail; return current state
    }

    return this.findById(orderId, userId);
  }
}
