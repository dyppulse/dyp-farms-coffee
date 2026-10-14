import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { StoreService } from '../common/data/store.service';
import { WalletService } from '../wallet/wallet.service';
import { WeatherService } from '../weather/weather.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private store: StoreService,
    private wallet: WalletService,
    private weather: WeatherService,
  ) {}

  @Get()
  async getDashboard(@Req() req: { user: { id: string } }) {
    const base = this.store.getDashboard(req.user.id);
    const walletBalance = await this.wallet.getBalance(req.user.id);
    // Home origin first: the dashboard weather card reports Uganda.
    const w = await this.weather.getWeatherByLocation('Uganda');
    const weatherInsights = {
      location: w.location,
      place: w.place,
      temperature: w.temperature,
      humidity: w.humidity,
      forecast: w.forecast,
    };
    return { ...base, walletBalance, weatherInsights };
  }
}
