import { PaymentProvider } from '../../provider.interface';
import {
  AirtelMoneyConfig,
  CollectionRequest,
  PaymentEvent,
  PaymentMethodId,
  PaymentResult,
} from '../../types';
import {
  airtelCollect,
  fetchAirtelToken,
  getAirtelTransactionStatus,
  mapAirtelStatus,
  normalizeAirtelPhone,
} from './airtel-money.client';
import { randomUUID } from 'crypto';

export class AirtelMoneyProvider implements PaymentProvider {
  readonly method: PaymentMethodId = 'airtel_money';

  constructor(private config: AirtelMoneyConfig) {}

  async initiateCollection(req: CollectionRequest): Promise<PaymentResult> {
    const transactionId = randomUUID();
    const phone = normalizeAirtelPhone(req.payerPhone);
    const token = await fetchAirtelToken(this.config);
    const result = await airtelCollect(this.config, token, {
      reference: req.reference,
      amount: req.money.amount,
      currency: req.money.currency || this.config.currency || 'UGX',
      phone,
      transactionId,
    });
    const status = mapAirtelStatus(result.data?.transaction?.status);
    return {
      providerReference: transactionId,
      status,
      raw: result,
    };
  }

  async verifyPayment(providerReference: string): Promise<PaymentResult> {
    const token = await fetchAirtelToken(this.config);
    const data = await getAirtelTransactionStatus(this.config, token, providerReference);
    return {
      providerReference,
      status: mapAirtelStatus(data.data?.transaction?.status),
      raw: data,
    };
  }

  parseWebhook(_headers: Record<string, string>, body: unknown): PaymentEvent {
    const payload = body as {
      transaction?: { id?: string; status?: string; amount?: number };
      reference?: string;
    };
    const tx = payload.transaction || {};
    return {
      method: 'airtel_money',
      providerReference: tx.id || '',
      merchantReference: payload.reference || '',
      status: mapAirtelStatus(tx.status),
      money: {
        amount: Number(tx.amount || 0),
        currency: this.config.currency || 'UGX',
      },
      occurredAt: new Date(),
    };
  }
}
