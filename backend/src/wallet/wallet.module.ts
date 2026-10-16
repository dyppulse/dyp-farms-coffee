import { Module, forwardRef } from '@nestjs/common';
import { AdminWalletController, WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { PaymentsBridgeModule } from '../payments-bridge/payments-bridge.module';

@Module({
  imports: [forwardRef(() => PaymentsBridgeModule)],
  controllers: [WalletController, AdminWalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
