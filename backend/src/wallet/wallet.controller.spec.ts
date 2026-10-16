import { ForbiddenException } from '@nestjs/common';
import { assertWalletMovementAllowed } from './wallet.controller';

describe('assertWalletMovementAllowed', () => {
  it('blocks top-ups and withdrawals in production', () => {
    expect(() => assertWalletMovementAllowed({ NODE_ENV: 'production' })).toThrow(
      ForbiddenException,
    );
  });

  it('stays blocked in production when PAYMENTS_MOCK is anything but "true"', () => {
    expect(() =>
      assertWalletMovementAllowed({ NODE_ENV: 'production', PAYMENTS_MOCK: 'false' }),
    ).toThrow(ForbiddenException);
  });

  it('allows explicit demo deployments', () => {
    expect(() =>
      assertWalletMovementAllowed({ NODE_ENV: 'production', PAYMENTS_MOCK: 'true' }),
    ).not.toThrow();
  });

  it('allows local development', () => {
    expect(() => assertWalletMovementAllowed({ NODE_ENV: 'development' })).not.toThrow();
    expect(() => assertWalletMovementAllowed({})).not.toThrow();
  });
});
