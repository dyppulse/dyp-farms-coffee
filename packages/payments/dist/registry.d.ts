import { PaymentProvider } from './provider.interface';
import { PaymentMethodId } from './types';
export declare class ProviderRegistry {
    private providers;
    register(provider: PaymentProvider): void;
    get(method: PaymentMethodId): PaymentProvider;
    listMethods(): PaymentMethodId[];
}
