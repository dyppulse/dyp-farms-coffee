import { Body, Controller, Headers, Post } from '@nestjs/common';
import { PaymentsBridgeService } from './payments-bridge.service';
import { BookingsService } from '../bookings/bookings.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private payments: PaymentsBridgeService,
    private bookings: BookingsService,
  ) {}

  @Post('mtn-momo')
  async mtnMomo(
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
  ) {
    const event = this.payments.handleWebhook('mtn_momo', headers, body);
    await this.bookings.onPaymentEvent(event);
    return { received: true };
  }

  @Post('airtel-money')
  async airtelMoney(
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
  ) {
    const event = this.payments.handleWebhook('airtel_money', headers, body);
    await this.bookings.onPaymentEvent(event);
    return { received: true };
  }
}
