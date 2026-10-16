import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentMethod,
  Prisma,
  TransactionProvider,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { PaymentEvent } from '@dyp/payments';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsBridgeService } from '../payments-bridge/payments-bridge.service';

const providerMap: Record<PaymentMethod, TransactionProvider> = {
  mtn_momo: TransactionProvider.mtn_momo,
  airtel_money: TransactionProvider.airtel_money,
};

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private payments: PaymentsBridgeService,
  ) {}

  /**
   * Spendable balance: completed movements, minus withdrawals still awaiting admin
   * approval (so the money is held the moment the request is made). Pending top-ups
   * never count until the provider confirms them.
   */
  async getBalance(
    userId: string,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<number> {
    const result = await db.transaction.aggregate({
      where: {
        userId,
        OR: [
          { status: TransactionStatus.completed },
          {
            status: TransactionStatus.pending,
            type: TransactionType.withdrawal,
          },
        ],
      },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  getTransactions(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { booking: { include: { tour: true, slot: true } } },
    });
  }

  /** Starts a mobile-money collection. The balance is credited only when it succeeds. */
  async addFunds(
    userId: string,
    dto: { amount: number; provider: PaymentMethod; phoneNumber: string },
  ) {
    this.payments.assertEnabled();
    const tx = await this.prisma.transaction.create({
      data: {
        userId,
        type: TransactionType.deposit,
        provider: providerMap[dto.provider],
        amount: dto.amount,
        currency: 'UGX',
        status: TransactionStatus.pending,
        description: 'Wallet top-up',
        metadata: { phoneNumber: dto.phoneNumber },
      },
    });

    let result;
    try {
      result = await this.payments.collect({
        method: dto.provider,
        money: { amount: dto.amount, currency: 'UGX' },
        payerPhone: dto.phoneNumber,
        reference: tx.id,
        description: 'Dyp Farms wallet top-up',
      });
    } catch (err) {
      await this.prisma.transaction.update({
        where: { id: tx.id },
        data: { status: TransactionStatus.failed },
      });
      throw new BadRequestException(
        `Payment initiation failed: ${(err as Error).message}`,
      );
    }

    const updated = await this.prisma.transaction.update({
      where: { id: tx.id },
      data: { externalReference: result.providerReference },
    });
    return { transaction: updated, paymentStatus: result.status };
  }

  /** Webhook / poll entry point. Safe to call repeatedly: only a pending deposit moves. */
  async onPaymentEvent(event: PaymentEvent) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: event.merchantReference },
    });
    if (!tx || tx.type !== TransactionType.deposit) return;
    if (tx.status !== TransactionStatus.pending) return;
    if (
      tx.externalReference &&
      tx.externalReference !== event.providerReference
    )
      return;

    if (event.status === 'successful') {
      if (event.money.amount !== tx.amount) return;
      await this.prisma.transaction.updateMany({
        where: { id: tx.id, status: TransactionStatus.pending },
        data: { status: TransactionStatus.completed },
      });
    } else if (event.status === 'failed' || event.status === 'expired') {
      await this.prisma.transaction.updateMany({
        where: { id: tx.id, status: TransactionStatus.pending },
        data: { status: TransactionStatus.failed },
      });
    }
  }

  async pollTopUp(transactionId: string, userId: string) {
    const tx = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId, type: TransactionType.deposit },
    });
    if (!tx) throw new NotFoundException('Transaction not found');

    if (tx.status === TransactionStatus.pending && tx.externalReference) {
      try {
        const method =
          tx.provider === TransactionProvider.mtn_momo
            ? 'mtn_momo'
            : 'airtel_money';
        const result = await this.payments.verify(method, tx.externalReference);
        if (result.status === 'successful' || result.status === 'failed') {
          await this.onPaymentEvent({
            method,
            providerReference: tx.externalReference,
            merchantReference: tx.id,
            status: result.status,
            money: { amount: tx.amount, currency: tx.currency },
            occurredAt: new Date(),
          });
        }
      } catch {
        // Provider check may fail; return the current state.
      }
    }
    const fresh = await this.prisma.transaction.findUnique({
      where: { id: tx.id },
    });
    return { transaction: fresh, balance: await this.getBalance(userId) };
  }

  /**
   * Debits atomically: a per-user advisory lock serialises concurrent requests, so the
   * balance check and the insert cannot interleave. The request stays pending until an
   * admin pays it out (the payment gateway only supports collections).
   */
  async withdraw(
    userId: string,
    dto: { amount: number; provider: PaymentMethod; phoneNumber: string },
  ) {
    this.payments.assertEnabled();
    const tx = await this.prisma.$transaction(async (db) => {
      await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
      const balance = await this.getBalance(userId, db);
      if (balance < dto.amount) {
        throw new BadRequestException('Insufficient balance');
      }
      return db.transaction.create({
        data: {
          userId,
          type: TransactionType.withdrawal,
          provider: providerMap[dto.provider],
          amount: -dto.amount,
          currency: 'UGX',
          status: TransactionStatus.pending,
          description: 'Withdrawal request',
          metadata: { phoneNumber: dto.phoneNumber },
        },
      });
    });
    return { balance: await this.getBalance(userId), transaction: tx };
  }

  listPendingWithdrawals() {
    return this.prisma.transaction.findMany({
      where: {
        type: TransactionType.withdrawal,
        status: TransactionStatus.pending,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Admin confirms the payout was sent. */
  async approveWithdrawal(id: string, payoutReference?: string) {
    return this.settleWithdrawal(id, TransactionStatus.completed, {
      payoutReference,
    });
  }

  /** Admin declines; the hold is released because the row stops being pending. */
  async rejectWithdrawal(id: string, reason: string) {
    return this.settleWithdrawal(id, TransactionStatus.failed, {
      rejectionReason: reason,
    });
  }

  private async settleWithdrawal(
    id: string,
    status: TransactionStatus,
    extra: Record<string, string | undefined>,
  ) {
    const tx = await this.prisma.transaction.findUnique({ where: { id } });
    if (!tx || tx.type !== TransactionType.withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }
    const prev = (tx.metadata as Record<string, unknown> | null) ?? {};
    const res = await this.prisma.transaction.updateMany({
      where: { id, status: TransactionStatus.pending },
      data: {
        status,
        metadata: { ...prev, ...extra } as Prisma.InputJsonValue,
        ...(extra.payoutReference
          ? { externalReference: extra.payoutReference }
          : {}),
      },
    });
    if (res.count === 0) {
      throw new BadRequestException('Withdrawal is no longer pending');
    }
    return this.prisma.transaction.findUnique({ where: { id } });
  }
}
