import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAuthToken, setAuthToken } from './client';

describe('auth token storage', () => {
  afterEach(() => localStorage.clear());

  it('stores and clears the token', () => {
    setAuthToken('abc');
    expect(getAuthToken()).toBe('abc');
    setAuthToken(null);
    expect(getAuthToken()).toBeNull();
  });

  it('does not throw when storage is unavailable', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getAuthToken()).toBeNull();
    spy.mockRestore();
  });
});
