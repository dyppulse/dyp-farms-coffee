import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { WalletAmountDto } from './dto/wallet.dto';
import { WalletService } from './wallet.service';
import { PaymentsBridgeService } from '../payments-bridge/payments-bridge.service';

/**
 * Wallet top-ups and withdrawals currently move balance with no payment-provider call, so
 * in a live environment any signed-in user could credit themselves. They stay available
 * for local development and demo deployments (PAYMENTS_MOCK=true) only, until top-ups are
 * collected through MTN MoMo / Airtel Money and withdrawals are paid out through them.
 */
export function assertWalletMovementAllowed(env: NodeJS.ProcessEnv = process.env) {
  if (env.NODE_ENV === 'production' && env.PAYMENTS_MOCK !== 'true') {
    throw new ForbiddenException(
      'Wallet top-ups and withdrawals are not available yet. You can pay for tours and orders directly with mobile money.',
    );
  }
}

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
    assertWalletMovementAllowed();
    return this.wallet.addFunds(req.user.id, dto.amount);
  }

  @Post('withdraw')
  withdraw(@Req() req: { user: { id: string } }, @Body() dto: WalletAmountDto) {
    assertWalletMovementAllowed();
    return this.wallet.withdraw(req.user.id, dto.amount);
  }
}
