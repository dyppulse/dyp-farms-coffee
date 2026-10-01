import { Body, Controller, Headers, Post } from '@nestjs/common';
import { PaymentsBridgeService } from './payments-bridge.service';
import { BookingsService } from '../bookings/bookings.service';
import { OrdersService } from '../shop-orders/orders.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private payments: PaymentsBridgeService,
    private bookings: BookingsService,
    private orders: OrdersService,
  ) {}

  @Post('mtn-momo')
  async mtnMomo(
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
  ) {
    const event = this.payments.handleWebhook('mtn_momo', headers, body);
    // Booking/order reference ids are disjoint cuid()s, so both handlers can
    // safely see every event — whichever owns event.merchantReference acts.
    await this.bookings.onPaymentEvent(event);
    await this.orders.onPaymentEvent(event);
    return { received: true };
  }

  @Post('airtel-money')
  async airtelMoney(
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
  ) {
    const event = this.payments.handleWebhook('airtel_money', headers, body);
    await this.bookings.onPaymentEvent(event);
    await this.orders.onPaymentEvent(event);
    return { received: true };
  }
}
