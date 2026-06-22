import { PaymentProvider } from '../../provider.interface';
import {
  CollectionRequest,
  MtnMomoConfig,
  PaymentEvent,
  PaymentMethodId,
  PaymentResult,
} from '../../types';
import {
  fetchMtnToken,
  getRequestToPayStatus,
  mapMtnStatus,
  normalizePhone,
  requestToPay,
} from './mtn-momo.client';
import { randomUUID } from 'crypto';

export class MtnMomoProvider implements PaymentProvider {
  readonly method: PaymentMethodId = 'mtn_momo';

  constructor(private config: MtnMomoConfig) {}

  async initiateCollection(req: CollectionRequest): Promise<PaymentResult> {
    const referenceId = randomUUID();
    const phone = normalizePhone(req.payerPhone);
    const token = await fetchMtnToken(this.config);
    await requestToPay(this.config, token, {
      referenceId,
      amount: req.money.amount,
      currency: req.money.currency || this.config.currency || 'UGX',
      phone,
      externalId: req.reference,
      payerMessage: req.description,
    });
    return { providerReference: referenceId, status: 'pending' };
  }

  async verifyPayment(providerReference: string): Promise<PaymentResult> {
    const token = await fetchMtnToken(this.config);
    const data = await getRequestToPayStatus(this.config, token, providerReference);
    return {
      providerReference,
      status: mapMtnStatus(data.status),
      raw: data,
    };
  }

  parseWebhook(_headers: Record<string, string>, body: unknown): PaymentEvent {
    const payload = body as {
      externalId?: string;
      financialTransactionId?: string;
      status?: string;
      amount?: string;
      currency?: string;
    };
    return {
      method: 'mtn_momo',
      providerReference: payload.financialTransactionId || '',
      merchantReference: payload.externalId || '',
      status: mapMtnStatus(payload.status || 'PENDING'),
      money: {
        amount: Number(payload.amount || 0),
        currency: payload.currency || 'UGX',
      },
      occurredAt: new Date(),
    };
  }
}
