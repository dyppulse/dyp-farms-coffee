import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderExpiryJob } from './order-expiry.job';
import { PaymentsBridgeModule } from '../payments-bridge/payments-bridge.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [forwardRef(() => PaymentsBridgeModule), NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderExpiryJob],
  exports: [OrdersService],
})
export class ShopOrdersModule {}
