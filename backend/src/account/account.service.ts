import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyPassword } from '../auth/password';
import { PrismaService } from '../prisma/prisma.service';

const REDACTED = 'deleted';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  /**
   * Permanently deletes the user and their personal data. Financial records
   * (Transaction, Booking, ShopOrder, payment attempts) are kept for legal
   * retention, with phone numbers / delivery addresses redacted.
   */
  async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.role === 'admin') {
      throw new ForbiddenException('Admin accounts cannot be self-deleted');
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('Incorrect password');
    }

    await this.prisma.$transaction([
      this.prisma.paymentAttempt.updateMany({
        where: { booking: { userId } },
        data: { phoneNumber: REDACTED },
      }),
      this.prisma.orderPaymentAttempt.updateMany({
        where: { order: { userId } },
        data: { phoneNumber: REDACTED },
      }),
      this.prisma.booking.updateMany({
        where: { userId },
        data: { paymentPhone: REDACTED },
      }),
      this.prisma.shopOrder.updateMany({
        where: { userId },
        data: { paymentPhone: REDACTED, deliveryAddress: null },
      }),
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.farm.deleteMany({ where: { ownerId: userId } }),
      this.prisma.ticketComment.deleteMany({ where: { authorId: userId } }),
      this.prisma.ticket.deleteMany({ where: { userId } }), // cascades comments
      this.prisma.autoBidLimit.deleteMany({ where: { userId } }),
      // Cascades bids, cart items and receipts; lots are kept with farmerId nulled.
      this.prisma.user.delete({ where: { id: userId } }),
    ]);
    return { deleted: true };
  }
}
