import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
