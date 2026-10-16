import { Injectable, ServiceUnavailableException } from '@nestjs/common';
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

  /**
   * PAYMENTS_ENABLED=false switches payments off on purpose: no provider is registered and
   * every payment route answers 503 with a plain message. Unlike PAYMENTS_MOCK this never
   * pretends a payment succeeded.
   */
  readonly enabled: boolean;

  constructor() {
    this.enabled = process.env.PAYMENTS_ENABLED !== 'false';

    if (!this.enabled) {
      this.gateway = createPaymentGateway();
      return;
    }

    const useMock =
      process.env.PAYMENTS_MOCK === 'true' || process.env.NODE_ENV === 'test';

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
        // Never fall back to fake providers in production: a missing credential must stop
        // the deploy instead of accepting "payments" that move no money. Set
        // PAYMENTS_MOCK=true explicitly for a staging or demo environment.
        if (process.env.NODE_ENV === 'production') {
          throw new Error(
            'No payment provider configured. Set MTN_MOMO_* and/or AIRTEL_* credentials, or PAYMENTS_MOCK=true for a non-live environment.',
          );
        }
        this.gateway.register(new MockMomoProvider());
        this.gateway.register(new MockAirtelProvider());
      }
    }
  }

  /** Throws 503 when payments are switched off. Call before creating any rows. */
  assertEnabled(): void {
    if (!this.enabled) {
      throw new ServiceUnavailableException(
        'Payments are not available yet. Please check back soon.',
      );
    }
  }

  listMethods(): PaymentMethodId[] {
    return this.enabled ? this.gateway.listMethods() : [];
  }

  collect(req: CollectionRequest): Promise<PaymentResult> {
    this.assertEnabled();
    return this.gateway.collect(req);
  }

  verify(method: PaymentMethodId, ref: string): Promise<PaymentResult> {
    this.assertEnabled();
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
