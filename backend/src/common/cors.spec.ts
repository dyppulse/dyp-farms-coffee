import { isOriginAllowed, originMatches, parseOrigins } from './cors';

describe('cors origins', () => {
  const allowed = parseOrigins(
    'https://dyp-farms-coffee.vercel.app, https://dyp-farms-coffee-*-dyp-pulses-projects.vercel.app/',
    '',
  );

  it('allows the production web origin exactly', () => {
    expect(isOriginAllowed('https://dyp-farms-coffee.vercel.app', allowed)).toBe(true);
  });

  it('tolerates spaces and a trailing slash in the setting', () => {
    expect(allowed[1]).toBe('https://dyp-farms-coffee-*-dyp-pulses-projects.vercel.app');
  });

  it('allows this team\'s preview deployments through the wildcard', () => {
    expect(
      isOriginAllowed('https://dyp-farms-coffee-8hlm2ccqf-dyp-pulses-projects.vercel.app', allowed),
    ).toBe(true);
  });

  it('rejects look-alike hosts', () => {
    for (const bad of [
      'https://dyp-farms-coffee.vercel.app.evil.com',
      'https://evil.com/dyp-farms-coffee-x-dyp-pulses-projects.vercel.app',
      'https://dyp-farms-coffee-x.evil-dyp-pulses-projects.vercel.app',
      'http://dyp-farms-coffee.vercel.app',
      'https://dyp-farms-coffee-a.b-dyp-pulses-projects.vercel.app',
    ]) {
      expect(isOriginAllowed(bad, allowed)).toBe(false);
    }
  });

  it('lets requests without an Origin through (mobile app, webhooks)', () => {
    expect(isOriginAllowed(undefined, allowed)).toBe(true);
  });

  it('treats patterns without * as exact', () => {
    expect(originMatches('https://a.com', 'https://a.com')).toBe(true);
    expect(originMatches('https://a.com.x', 'https://a.com')).toBe(false);
  });
});
