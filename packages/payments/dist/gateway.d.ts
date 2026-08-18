import { PaymentProvider } from './provider.interface';
import { CollectionRequest, PaymentEvent, PaymentMethodId, PaymentResult, PaymentsConfig } from './types';
export declare class PaymentGateway {
    private registry;
    constructor(config?: PaymentsConfig);
    register(provider: PaymentProvider): void;
    collect(req: CollectionRequest): Promise<PaymentResult>;
    verify(method: PaymentMethodId, providerReference: string): Promise<PaymentResult>;
    handleWebhook(method: PaymentMethodId, headers: Record<string, string>, body: unknown): PaymentEvent;
    listMethods(): PaymentMethodId[];
}
export declare function createPaymentGateway(config?: PaymentsConfig): PaymentGateway;
