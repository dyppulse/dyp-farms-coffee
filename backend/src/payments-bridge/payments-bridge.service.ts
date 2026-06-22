import { Injectable } from '@nestjs/common';
import {
  CollectionRequest,
  createPaymentGateway,
  MockAirtelProvider,
  MockMomoProvider,
  PaymentGateway,
  PaymentMethodId,
  PaymentResult,
} from '@dyp/payments';

@Injectable()
export class PaymentsBridgeService {
  private gateway: PaymentGateway;

  constructor() {
    const useMock = process.env.PAYMENTS_MOCK === 'true' || process.env.NODE_ENV === 'test';

    if (useMock) {
      this.gateway = createPaymentGateway();
      this.gateway.register(new MockMomoProvider());
      this.gateway.register(new MockAirtelProvider());
    } else {
      const mtnKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY;
      const mtnUser = process.env.MTN_MOMO_API_USER;
      const mtnApiKey = process.env.MTN_MOMO_API_KEY;
      const airtelId = process.env.AIRTEL_CLIENT_ID;
      const airtelSecret = process.env.AIRTEL_CLIENT_SECRET;

      this.gateway = createPaymentGateway({
        ...(mtnKey && mtnUser && mtnApiKey
          ? {
              mtnMomo: {
                subscriptionKey: mtnKey,
                apiUser: mtnUser,
                apiKey: mtnApiKey,
                targetEnvironment: process.env.MTN_MOMO_TARGET_ENV || 'sandbox',
                callbackUrl:
                  process.env.MTN_MOMO_CALLBACK_URL ||
                  'http://localhost:3001/api/webhooks/mtn-momo',
                currency: 'UGX',
              },
            }
          : {}),
        ...(airtelId && airtelSecret
          ? {
              airtelMoney: {
                clientId: airtelId,
                clientSecret: airtelSecret,
                pin: process.env.AIRTEL_PIN || '',
                country: process.env.AIRTEL_COUNTRY || 'UG',
                callbackUrl:
                  process.env.AIRTEL_CALLBACK_URL ||
                  'http://localhost:3001/api/webhooks/airtel-money',
                currency: 'UGX',
              },
            }
          : {}),
      });

      if (this.gateway.listMethods().length === 0) {
        this.gateway.register(new MockMomoProvider());
        this.gateway.register(new MockAirtelProvider());
      }
    }
  }

  listMethods(): PaymentMethodId[] {
    return this.gateway.listMethods();
  }

  collect(req: CollectionRequest): Promise<PaymentResult> {
    return this.gateway.collect(req);
  }

  verify(method: PaymentMethodId, ref: string): Promise<PaymentResult> {
    return this.gateway.verify(method, ref);
  }

  handleWebhook(
    method: PaymentMethodId,
    headers: Record<string, string>,
    body: unknown,
  ) {
    return this.gateway.handleWebhook(method, headers, body);
  }
}
