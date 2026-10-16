import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, clearLegacySession } from './client';

describe('legacy session cleanup', () => {
  afterEach(() => localStorage.clear());

  it('removes the token and user that old versions kept in localStorage', () => {
    localStorage.setItem('dyp_web_token', 'old-jwt');
    localStorage.setItem('dyp_web_user', '{"id":"1"}');
    clearLegacySession();
    expect(localStorage.getItem('dyp_web_token')).toBeNull();
    expect(localStorage.getItem('dyp_web_user')).toBeNull();
  });

  it('does not throw when storage is unavailable', () => {
    const spy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => clearLegacySession()).not.toThrow();
    spy.mockRestore();
  });
});

describe('cookie session requests', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ user: { id: '1', email: 'a@b.c', name: 'A', role: 'farmer' } }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('talks to the same-origin /api and sends credentials', async () => {
    await api.auth.me();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/auth/me');
    expect(init.credentials).toBe('include');
  });

  it('adds the CSRF client header and never an Authorization header', async () => {
    await api.auth.logout();
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers['X-Dyp-Client']).toBe('web');
    expect(init.headers.Authorization).toBeUndefined();
    expect(init.method).toBe('POST');
  });
});
