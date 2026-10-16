import { extractToken, isCsrfSafe, readCookie } from './session-cookie';

const req = (headers: Record<string, string>, method = 'GET') => ({ headers, method }) as never;

describe('session cookie helpers', () => {
  it('reads a named cookie among others and decodes it', () => {
    expect(readCookie('a=1; dyp_session=abc%2Bdef; b=2', 'dyp_session')).toBe('abc+def');
    expect(readCookie('a=1', 'dyp_session')).toBeNull();
    expect(readCookie(undefined, 'dyp_session')).toBeNull();
  });

  it('prefers the Bearer header over the cookie', () => {
    expect(
      extractToken(req({ authorization: 'Bearer from-header', cookie: 'dyp_session=from-cookie' })),
    ).toBe('from-header');
  });

  it('falls back to the cookie for the web app', () => {
    expect(extractToken(req({ cookie: 'dyp_session=from-cookie' }))).toBe('from-cookie');
    expect(extractToken(req({}))).toBeNull();
  });

  it('blocks cookie-authenticated writes without the client header', () => {
    expect(isCsrfSafe(req({ cookie: 'dyp_session=t' }, 'POST'))).toBe(false);
    expect(isCsrfSafe(req({ cookie: 'dyp_session=t', 'x-dyp-client': 'web' }, 'POST'))).toBe(true);
    expect(isCsrfSafe(req({ cookie: 'dyp_session=t' }, 'DELETE'))).toBe(false);
  });

  it('allows reads and Bearer-token writes (mobile) without the header', () => {
    expect(isCsrfSafe(req({ cookie: 'dyp_session=t' }, 'GET'))).toBe(true);
    expect(isCsrfSafe(req({ authorization: 'Bearer t' }, 'POST'))).toBe(true);
  });
});
