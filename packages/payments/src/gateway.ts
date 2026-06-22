import { ProviderRegistry } from './registry';
import { PaymentProvider } from './provider.interface';
import {
  CollectionRequest,
  PaymentEvent,
  PaymentMethodId,
  PaymentResult,
  PaymentsConfig,
} from './types';
import { MtnMomoProvider } from './providers/mtn-momo/mtn-momo.provider';
import { AirtelMoneyProvider } from './providers/airtel-money/airtel-money.provider';

export class PaymentGateway {
  private registry = new ProviderRegistry();

  constructor(config?: PaymentsConfig) {
    if (config?.mtnMomo) {
      this.register(new MtnMomoProvider(config.mtnMomo));
    }
    if (config?.airtelMoney) {
      this.register(new AirtelMoneyProvider(config.airtelMoney));
    }
  }

  register(provider: PaymentProvider): void {
    this.registry.register(provider);
  }

  collect(req: CollectionRequest): Promise<PaymentResult> {
    return this.registry.get(req.method).initiateCollection(req);
  }

  verify(method: PaymentMethodId, providerReference: string): Promise<PaymentResult> {
    return this.registry.get(method).verifyPayment(providerReference);
  }

  handleWebhook(
    method: PaymentMethodId,
    headers: Record<string, string>,
    body: unknown,
  ): PaymentEvent {
    const provider = this.registry.get(method);
    if (provider.verifyWebhookSignature && !provider.verifyWebhookSignature(headers, body)) {
      throw new Error('Invalid webhook signature');
    }
    return provider.parseWebhook(headers, body);
  }

  listMethods(): PaymentMethodId[] {
    return this.registry.listMethods();
  }
}

export function createPaymentGateway(config?: PaymentsConfig): PaymentGateway {
  return new PaymentGateway(config);
}
