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
    expect(() => new PaymentsBridgeService()).toThrow(
      /No payment provider configured/,
    );
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

  describe('PAYMENTS_ENABLED=false', () => {
    function disabled() {
      clearProviderEnv();
      process.env.NODE_ENV = 'production';
      process.env.PAYMENTS_ENABLED = 'false';
      return new PaymentsBridgeService();
    }

    it('starts in production without credentials and offers no methods', () => {
      const svc = disabled();
      expect(svc.enabled).toBe(false);
      expect(svc.listMethods()).toEqual([]);
    });

    it('refuses to collect or verify instead of faking a payment', () => {
      const svc = disabled();
      expect(() => svc.assertEnabled()).toThrow(/not available yet/);
      expect(() =>
        svc.collect({
          method: 'mtn_momo',
          money: { amount: 1000, currency: 'UGX' },
          payerPhone: '256770000000',
          reference: 'r1',
          description: 'x',
        }),
      ).toThrow(/not available yet/);
      expect(() => svc.verify('mtn_momo', 'ref')).toThrow(/not available yet/);
    });

    it('ignores PAYMENTS_MOCK so a demo flag cannot turn fake payments on', () => {
      clearProviderEnv();
      process.env.NODE_ENV = 'production';
      process.env.PAYMENTS_ENABLED = 'false';
      process.env.PAYMENTS_MOCK = 'true';
      expect(new PaymentsBridgeService().listMethods()).toEqual([]);
    });
  });
});
