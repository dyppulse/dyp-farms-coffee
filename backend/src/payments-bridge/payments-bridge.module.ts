import { Module, forwardRef } from '@nestjs/common';
import { PaymentsBridgeService } from './payments-bridge.service';
import { WebhooksController } from './webhooks.controller';
import { BookingsModule } from '../bookings/bookings.module';
import { ShopOrdersModule } from '../shop-orders/shop-orders.module';

@Module({
  imports: [
    forwardRef(() => BookingsModule),
    forwardRef(() => ShopOrdersModule),
  ],
  controllers: [WebhooksController],
  providers: [PaymentsBridgeService],
  exports: [PaymentsBridgeService],
})
export class PaymentsBridgeModule {}
