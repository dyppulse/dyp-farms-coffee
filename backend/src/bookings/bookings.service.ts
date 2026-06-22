import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  BookingStatus,
  PaymentAttemptStatus,
  PaymentMethod,
  SlotStatus,
  TransactionProvider,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { PaymentEvent } from '@dyp/payments';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsBridgeService } from '../payments-bridge/payments-bridge.service';
import { MailService } from '../notifications/mail.service';
import { StoreService } from '../common/data/store.service';
import { CreateBookingDto } from './dto/create-booking.dto';

const BOOKING_EXPIRY_MINUTES = 15;

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private payments: PaymentsBridgeService,
    private mail: MailService,
    private store: StoreService,
  ) {}

  findByUser(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        tour: true,
        slot: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { tour: true, slot: true, paymentAttempts: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new ForbiddenException();
    return booking;
  }

  async getTicket(id: string, userId: string) {
    const booking = await this.findById(id, userId);
    if (booking.status !== BookingStatus.confirmed || !booking.ticketCode) {
      throw new BadRequestException('Ticket not available');
    }
    const verifyUrl = `${process.env.API_PUBLIC_URL || 'http://localhost:3001/api'}/bookings/verify?code=${booking.ticketCode}`;
    return {
      ticketCode: booking.ticketCode,
      verifyUrl,
      booking: {
        id: booking.id,
        tour: booking.tour.title,
        location: booking.tour.locationName,
        date: booking.slot.date,
        startTime: booking.slot.startTime,
        endTime: booking.slot.endTime,
        guests: booking.guests,
        totalAmount: booking.totalAmount,
        currency: booking.currency,
      },
    };
  }

  async verifyTicket(code: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { ticketCode: code },
      include: { tour: true, slot: true },
    });
    if (!booking || booking.status !== BookingStatus.confirmed) {
      return { valid: false };
    }
    return {
      valid: true,
      booking: {
        ticketCode: booking.ticketCode,
        tour: booking.tour.title,
        location: booking.tour.locationName,
        date: booking.slot.date,
        startTime: booking.slot.startTime,
        endTime: booking.slot.endTime,
        guests: booking.guests,
      },
    };
  }

  async createBooking(tourId: string, userId: string, dto: CreateBookingDto) {
    const tour = await this.prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) throw new NotFoundException('Tour not found');

    const slot = await this.prisma.tourSlot.findUnique({
      where: { id: dto.slotId },
    });
    if (!slot || slot.tourId !== tourId) {
      throw new BadRequestException('Invalid slot');
    }
    if (slot.status !== SlotStatus.open) {
      throw new BadRequestException('Slot is not available');
    }
    const slotDate = new Date(slot.date);
    slotDate.setHours(23, 59, 59, 999);
    if (slotDate < new Date()) {
      throw new BadRequestException('Slot is in the past');
    }
    const remaining = slot.capacity - slot.bookedGuests;
    if (dto.guests > remaining) {
      throw new BadRequestException(`Only ${remaining} spots remaining`);
    }

    const subtotal = tour.pricePerGuest * dto.guests;
    const totalAmount = subtotal + tour.bookingFee;
    const expiresAt = new Date(Date.now() + BOOKING_EXPIRY_MINUTES * 60 * 1000);

    const booking = await this.prisma.booking.create({
      data: {
        userId,
        tourId,
        slotId: dto.slotId,
        guests: dto.guests,
        subtotal,
        bookingFee: tour.bookingFee,
        totalAmount,
        currency: tour.currency,
        status: BookingStatus.pending_payment,
        paymentMethod: dto.paymentMethod,
        paymentPhone: dto.phoneNumber,
        expiresAt,
      },
      include: { tour: true, slot: true },
    });

    const providerMap: Record<PaymentMethod, TransactionProvider> = {
      mtn_momo: TransactionProvider.mtn_momo,
      airtel_money: TransactionProvider.airtel_money,
    };

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        bookingId: booking.id,
        type: TransactionType.tour_booking,
        provider: providerMap[dto.paymentMethod],
        amount: -totalAmount,
        currency: tour.currency,
        status: TransactionStatus.pending,
        description: `${tour.title} — ${dto.guests} guest(s)`,
      },
    });

    let paymentResult;
    try {
      paymentResult = await this.payments.collect({
        method: dto.paymentMethod,
        money: { amount: totalAmount, currency: tour.currency },
        payerPhone: dto.phoneNumber,
        reference: booking.id,
        description: `Dyp Farms: ${tour.title}`,
      });
    } catch (err) {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.cancelled },
      });
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.failed },
      });
      throw new BadRequestException(
        `Payment initiation failed: ${(err as Error).message}`,
      );
    }

    await this.prisma.paymentAttempt.create({
      data: {
        bookingId: booking.id,
        provider: dto.paymentMethod,
        phoneNumber: dto.phoneNumber,
        amount: totalAmount,
        currency: tour.currency,
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
      bookingId: booking.id,
      totalAmount,
      currency: tour.currency,
      paymentStatus: paymentResult.status,
      providerReference: paymentResult.providerReference,
      expiresAt,
    };
  }

  async onPaymentEvent(event: PaymentEvent) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: event.merchantReference },
      include: { tour: true, slot: true },
    });
    if (!booking) return;

    if (booking.status === BookingStatus.confirmed) return;

    const attempt = await this.prisma.paymentAttempt.findFirst({
      where: {
        bookingId: booking.id,
        providerReference: event.providerReference,
      },
    });

    if (event.status === 'successful') {
      await this.prisma.$transaction(async (tx) => {
        const slot = await tx.tourSlot.findUnique({
          where: { id: booking.slotId },
        });
        if (!slot) return;

        const ticketCode = `DYP-TKT-${Date.now().toString(36).toUpperCase()}`;

        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.confirmed,
            ticketCode,
            confirmedAt: new Date(),
          },
        });

        const newBooked = slot.bookedGuests + booking.guests;
        await tx.tourSlot.update({
          where: { id: slot.id },
          data: {
            bookedGuests: newBooked,
            status:
              newBooked >= slot.capacity ? SlotStatus.full : SlotStatus.open,
          },
        });

        if (attempt) {
          await tx.paymentAttempt.update({
            where: { id: attempt.id },
            data: { status: PaymentAttemptStatus.successful },
          });
        }

        await tx.transaction.updateMany({
          where: { bookingId: booking.id },
          data: { status: TransactionStatus.completed },
        });
      });

      const user = this.store.findUserById(booking.userId);
      if (user?.email) {
        await this.mail.sendBookingConfirmation(user.email, {
          userName: user.name,
          tour: booking.tour,
          slot: booking.slot,
          booking,
          ticketCode:
            (
              await this.prisma.booking.findUnique({
                where: { id: booking.id },
              })
            )?.ticketCode || '',
        });
      }
    } else if (event.status === 'failed' || event.status === 'expired') {
      await this.releaseBooking(booking.id, event.status);
    }
  }

  async releaseBooking(bookingId: string, reason: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking || booking.status !== BookingStatus.pending_payment) return;

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status:
          reason === 'expired'
            ? BookingStatus.expired
            : BookingStatus.cancelled,
      },
    });

    await this.prisma.transaction.updateMany({
      where: { bookingId },
      data: { status: TransactionStatus.failed },
    });

    await this.prisma.paymentAttempt.updateMany({
      where: { bookingId },
      data: { status: PaymentAttemptStatus.failed },
    });
  }

  async expirePendingBookings() {
    const expired = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.pending_payment,
        expiresAt: { lt: new Date() },
      },
    });
    for (const booking of expired) {
      await this.releaseBooking(booking.id, 'expired');
    }
    return expired.length;
  }

  async pollPaymentStatus(bookingId: string, userId: string) {
    const booking = await this.findById(bookingId, userId);
    if (booking.status !== BookingStatus.pending_payment) return booking;

    const attempt = booking.paymentAttempts[0];
    if (!attempt?.providerReference) return booking;

    try {
      const result = await this.payments.verify(
        booking.paymentMethod,
        attempt.providerReference,
      );
      if (result.status === 'successful' || result.status === 'failed') {
        await this.onPaymentEvent({
          method: booking.paymentMethod,
          providerReference: attempt.providerReference,
          merchantReference: booking.id,
          status: result.status,
          money: { amount: booking.totalAmount, currency: booking.currency },
          occurredAt: new Date(),
        });
      }
    } catch {
      // Provider check may fail; return current state
    }

    return this.findById(bookingId, userId);
  }
}
