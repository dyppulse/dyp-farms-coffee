import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrdersService } from './orders.service';

@Injectable()
export class OrderExpiryJob {
  constructor(private orders: OrdersService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expireOrders() {
    await this.orders.expirePendingOrders();
  }
}
