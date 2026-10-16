import { PageQueryDto, toPage } from '../common/pagination';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ApproveWithdrawalDto, RejectWithdrawalDto, WalletAmountDto } from './dto/wallet.dto';
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
  async getWallet(@Req() req: { user: { id: string } }, @Query() page: PageQueryDto) {
    const [balance, transactions] = await Promise.all([
      this.wallet.getBalance(req.user.id),
      this.wallet.getTransactions(req.user.id, toPage(page)),
    ]);
    return { balance, transactions };
  }

  @Get('payment-methods')
  getPaymentMethods() {
    return { methods: this.payments.listMethods() };
  }

  @Post('add-funds')
  addFunds(@Req() req: { user: { id: string } }, @Body() dto: WalletAmountDto) {
    return this.wallet.addFunds(req.user.id, dto);
  }

  @Post('transactions/:id/poll')
  poll(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.wallet.pollTopUp(id, req.user.id);
  }

  @Post('withdraw')
  withdraw(@Req() req: { user: { id: string } }, @Body() dto: WalletAmountDto) {
    return this.wallet.withdraw(req.user.id, dto);
  }
}

@Controller('admin/wallet/withdrawals')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminWalletController {
  constructor(private wallet: WalletService) {}

  @Get()
  list() {
    return this.wallet.listPendingWithdrawals();
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveWithdrawalDto) {
    return this.wallet.approveWithdrawal(id, dto.payoutReference);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectWithdrawalDto) {
    return this.wallet.rejectWithdrawal(id, dto.reason);
  }
}
