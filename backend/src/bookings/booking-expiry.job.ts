import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class BookingExpiryJob {
  constructor(private bookings: BookingsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expireBookings() {
    await this.bookings.expirePendingBookings();
  }
}
