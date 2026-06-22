import { CollectionRequest, PaymentEvent, PaymentMethodId, PaymentResult } from './types';

export interface PaymentProvider {
  readonly method: PaymentMethodId;
  initiateCollection(req: CollectionRequest): Promise<PaymentResult>;
  verifyPayment(providerReference: string): Promise<PaymentResult>;
  parseWebhook(headers: Record<string, string>, body: unknown): PaymentEvent;
  verifyWebhookSignature?(headers: Record<string, string>, body: unknown): boolean;
}
