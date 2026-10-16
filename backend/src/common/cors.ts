/**
 * Matches a browser Origin against a CORS_ORIGINS entry. An entry is an exact origin, or
 * contains `*` to stand for one hostname label run (letters, digits, hyphens; never dots
 * or slashes), e.g. https://dyp-farms-coffee-*-dyp-pulses-projects.vercel.app for Vercel
 * preview deployments.
 */
export function originMatches(origin: string, pattern: string): boolean {
  if (!pattern.includes('*')) return origin === pattern;
  const source = pattern
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('[a-z0-9-]+');
  return new RegExp(`^${source}$`, 'i').test(origin);
}

export function parseOrigins(value: string | undefined, fallback: string): string[] {
  return (value ?? fallback)
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

export function isOriginAllowed(origin: string | undefined, allowed: string[]): boolean {
  return !origin || allowed.some((pattern) => originMatches(origin, pattern));
}
