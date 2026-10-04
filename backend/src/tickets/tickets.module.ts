import { Module } from '@nestjs/common';
import { TicketsController, AdminTicketsController } from './tickets.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { TicketsService } from './tickets.service';

// PrismaService/StoreService come from PrismaModule/StoreModule, both @Global().
@Module({
  imports: [NotificationsModule],
  controllers: [TicketsController, AdminTicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
