import { Module } from '@nestjs/common';
import { AuctionsController } from './auctions.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AuctionsController],
})
export class AuctionsModule {}
