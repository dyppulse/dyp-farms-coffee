import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { WalletModule } from '../wallet/wallet.module';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [WalletModule, WeatherModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
