import { PaymentProvider } from '../../provider.interface';
import { AirtelMoneyConfig, CollectionRequest, PaymentEvent, PaymentMethodId, PaymentResult } from '../../types';
export declare class AirtelMoneyProvider implements PaymentProvider {
    private config;
    readonly method: PaymentMethodId;
    constructor(config: AirtelMoneyConfig);
    initiateCollection(req: CollectionRequest): Promise<PaymentResult>;
    verifyPayment(providerReference: string): Promise<PaymentResult>;
    parseWebhook(_headers: Record<string, string>, body: unknown): PaymentEvent;
}
