import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { WalletAmountDto } from './dto/wallet.dto';
import { WalletService } from './wallet.service';
import { PaymentsBridgeService } from '../payments-bridge/payments-bridge.service';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(
    private wallet: WalletService,
    private payments: PaymentsBridgeService,
  ) {}

  @Get()
  async getWallet(@Req() req: { user: { id: string } }) {
    const [balance, transactions] = await Promise.all([
      this.wallet.getBalance(req.user.id),
      this.wallet.getTransactions(req.user.id),
    ]);
    return { balance, transactions };
  }

  @Get('payment-methods')
  getPaymentMethods() {
    return { methods: this.payments.listMethods() };
  }

  @Post('add-funds')
  addFunds(@Req() req: { user: { id: string } }, @Body() dto: WalletAmountDto) {
    return this.wallet.addFunds(req.user.id, dto.amount);
  }

  @Post('withdraw')
  withdraw(@Req() req: { user: { id: string } }, @Body() dto: WalletAmountDto) {
    return this.wallet.withdraw(req.user.id, dto.amount);
  }
}
