import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { StoreModule } from './common/data/store.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuctionsModule } from './auctions/auctions.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LogisticsModule } from './logistics/logistics.module';
import { LotsModule } from './lots/lots.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsBridgeModule } from './payments-bridge/payments-bridge.module';
import { QualityModule } from './quality/quality.module';
import { ToursModule } from './tours/tours.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    StoreModule,
    AuthModule,
    NotificationsModule,
    PaymentsBridgeModule,
    BookingsModule,
    DashboardModule,
    WalletModule,
    LotsModule,
    AuctionsModule,
    LogisticsModule,
    ToursModule,
    QualityModule,
  ],
})
export class AppModule {}
