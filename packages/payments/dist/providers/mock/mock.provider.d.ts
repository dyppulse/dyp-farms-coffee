import { PaymentProvider } from '../../provider.interface';
import { CollectionRequest, PaymentEvent, PaymentMethodId, PaymentResult } from '../../types';
export declare class MockMomoProvider implements PaymentProvider {
    readonly method: PaymentMethodId;
    initiateCollection(req: CollectionRequest): Promise<PaymentResult>;
    verifyPayment(providerReference: string): Promise<PaymentResult>;
    parseWebhook(_headers: Record<string, string>, body: unknown): PaymentEvent;
    static simulateSuccess(providerReference: string): CollectionRequest | undefined;
}
export declare class MockAirtelProvider implements PaymentProvider {
    readonly method: PaymentMethodId;
    initiateCollection(req: CollectionRequest): Promise<PaymentResult>;
    verifyPayment(providerReference: string): Promise<PaymentResult>;
    parseWebhook(_headers: Record<string, string>, body: unknown): PaymentEvent;
}
