import { PaymentProvider } from '../../provider.interface';
import { CollectionRequest, MtnMomoConfig, PaymentEvent, PaymentMethodId, PaymentResult } from '../../types';
export declare class MtnMomoProvider implements PaymentProvider {
    private config;
    readonly method: PaymentMethodId;
    constructor(config: MtnMomoConfig);
    initiateCollection(req: CollectionRequest): Promise<PaymentResult>;
    verifyPayment(providerReference: string): Promise<PaymentResult>;
    parseWebhook(_headers: Record<string, string>, body: unknown): PaymentEvent;
}
