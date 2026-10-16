import { Module } from '@nestjs/common';
import { AdminStatsController } from './admin.controller';
import { AdminDemoAccountsController } from './demo-accounts.controller';

// PrismaService/StoreService come from PrismaModule/StoreModule, both @Global().
// Farm/ticket admin listing routes live in FarmsModule/TicketsModule; this module
// only holds the cross-cutting /admin/stats aggregate.
@Module({
  controllers: [AdminStatsController, AdminDemoAccountsController],
})
export class AdminModule {}
