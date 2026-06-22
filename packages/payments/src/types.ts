export type PaymentMethodId =
  | 'mtn_momo'
  | 'airtel_money'
  | 'stripe'
  | 'wallet';

export type PaymentStatus =
  | 'pending'
  | 'successful'
  | 'failed'
  | 'expired';

export interface Money {
  amount: number;
  currency: string;
}

export interface CollectionRequest {
  method: PaymentMethodId;
  money: Money;
  payerPhone: string;
  reference: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  providerReference: string;
  status: PaymentStatus;
  raw?: unknown;
}

export interface PaymentEvent {
  method: PaymentMethodId;
  providerReference: string;
  merchantReference: string;
  status: PaymentStatus;
  money: Money;
  occurredAt: Date;
}

export interface MtnMomoConfig {
  subscriptionKey: string;
  apiUser: string;
  apiKey: string;
  targetEnvironment: 'sandbox' | 'mtnuganda' | string;
  callbackUrl: string;
  currency?: string;
}

export interface AirtelMoneyConfig {
  clientId: string;
  clientSecret: string;
  pin: string;
  country: string;
  callbackUrl: string;
  currency?: string;
}

export interface PaymentsConfig {
  mtnMomo?: MtnMomoConfig;
  airtelMoney?: AirtelMoneyConfig;
}
