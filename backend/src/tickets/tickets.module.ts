import { Module } from '@nestjs/common';
import { TicketsController, AdminTicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

// PrismaService/StoreService come from PrismaModule/StoreModule, both @Global().
@Module({
  controllers: [TicketsController, AdminTicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
