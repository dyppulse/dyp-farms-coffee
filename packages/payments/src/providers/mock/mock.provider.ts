import { PaymentProvider } from '../../provider.interface';
import {
  CollectionRequest,
  PaymentEvent,
  PaymentMethodId,
  PaymentResult,
} from '../../types';

const pending = new Map<string, CollectionRequest>();

export class MockMomoProvider implements PaymentProvider {
  readonly method: PaymentMethodId = 'mtn_momo';

  async initiateCollection(req: CollectionRequest): Promise<PaymentResult> {
    const ref = `mock-${req.reference}`;
    pending.set(ref, req);
    return { providerReference: ref, status: 'pending' };
  }

  async verifyPayment(providerReference: string): Promise<PaymentResult> {
    return { providerReference, status: 'pending' };
  }

  parseWebhook(_headers: Record<string, string>, body: unknown): PaymentEvent {
    const payload = body as {
      providerReference: string;
      merchantReference: string;
      status: 'successful' | 'failed';
      amount: number;
      currency?: string;
    };
    return {
      method: 'mtn_momo',
      providerReference: payload.providerReference,
      merchantReference: payload.merchantReference,
      status: payload.status,
      money: { amount: payload.amount, currency: payload.currency || 'UGX' },
      occurredAt: new Date(),
    };
  }

  static simulateSuccess(providerReference: string) {
    return pending.get(providerReference);
  }
}

export class MockAirtelProvider implements PaymentProvider {
  readonly method: PaymentMethodId = 'airtel_money';

  async initiateCollection(req: CollectionRequest): Promise<PaymentResult> {
    const ref = `mock-airtel-${req.reference}`;
    return { providerReference: ref, status: 'pending' };
  }

  async verifyPayment(providerReference: string): Promise<PaymentResult> {
    return { providerReference, status: 'pending' };
  }

  parseWebhook(_headers: Record<string, string>, body: unknown): PaymentEvent {
    const payload = body as {
      reference: string;
      transaction: { id: string; status: string; amount: number };
    };
    return {
      method: 'airtel_money',
      providerReference: payload.transaction.id,
      merchantReference: payload.reference,
      status: payload.transaction.status === 'TS' ? 'successful' : 'failed',
      money: { amount: payload.transaction.amount, currency: 'UGX' },
      occurredAt: new Date(),
    };
  }
}
