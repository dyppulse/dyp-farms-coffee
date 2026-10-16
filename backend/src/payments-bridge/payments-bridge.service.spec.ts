import { PaymentsBridgeService } from './payments-bridge.service';

describe('PaymentsBridgeService', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  function clearProviderEnv() {
    for (const key of [
      'MTN_MOMO_SUBSCRIPTION_KEY',
      'MTN_MOMO_API_USER',
      'MTN_MOMO_API_KEY',
      'AIRTEL_CLIENT_ID',
      'AIRTEL_CLIENT_SECRET',
      'PAYMENTS_MOCK',
    ]) {
      delete process.env[key];
    }
  }

  it('refuses to start in production with no payment credentials', () => {
    clearProviderEnv();
    process.env.NODE_ENV = 'production';
    expect(() => new PaymentsBridgeService()).toThrow(/No payment provider configured/);
  });

  it('allows mock providers in production only when PAYMENTS_MOCK=true', () => {
    clearProviderEnv();
    process.env.NODE_ENV = 'production';
    process.env.PAYMENTS_MOCK = 'true';
    expect(new PaymentsBridgeService().listMethods().length).toBeGreaterThan(0);
  });

  it('falls back to mock providers outside production for local development', () => {
    clearProviderEnv();
    process.env.NODE_ENV = 'development';
    expect(new PaymentsBridgeService().listMethods().length).toBeGreaterThan(0);
  });
});
