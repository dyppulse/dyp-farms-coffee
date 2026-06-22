import { PaymentProvider } from './provider.interface';
import { ProviderNotFoundError } from './errors';
import { PaymentMethodId } from './types';

export class ProviderRegistry {
  private providers = new Map<PaymentMethodId, PaymentProvider>();

  register(provider: PaymentProvider): void {
    this.providers.set(provider.method, provider);
  }

  get(method: PaymentMethodId): PaymentProvider {
    const provider = this.providers.get(method);
    if (!provider) throw new ProviderNotFoundError(method);
    return provider;
  }

  listMethods(): PaymentMethodId[] {
    return [...this.providers.keys()];
  }
}
