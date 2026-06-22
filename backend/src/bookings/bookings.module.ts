import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingExpiryJob } from './booking-expiry.job';
import { PaymentsBridgeModule } from '../payments-bridge/payments-bridge.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => PaymentsBridgeModule),
    NotificationsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingExpiryJob],
  exports: [BookingsService],
})
export class BookingsModule {}
