import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { StoreService } from '../common/data/store.service';
import { WalletService } from '../wallet/wallet.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private store: StoreService,
    private wallet: WalletService,
  ) {}

  @Get()
  async getDashboard(@Req() req: { user: { id: string } }) {
    const base = this.store.getDashboard(req.user.id);
    const walletBalance = await this.wallet.getBalance(req.user.id);
    return { ...base, walletBalance };
  }
}
