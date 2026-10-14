import { randomBytes } from 'crypto';

let cached: string | undefined;

/**
 * The JWT signing secret. Never falls back to a value that's in the repo when running in
 * production: if JWT_SECRET is missing there, a random per-boot secret is used (tokens
 * can't be forged, but everyone is logged out on each restart) and an error is logged so
 * it gets fixed. The fixed dev secret is only used outside production.
 */
export function getJwtSecret(): string {
  if (cached) return cached;
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv) {
    cached = fromEnv;
  } else if (process.env.NODE_ENV === 'production') {
    console.error(
      '[auth] JWT_SECRET is not set in production — using a random secret for this boot. ' +
        'Sessions will not survive a restart. Set JWT_SECRET in the environment.',
    );
    cached = randomBytes(32).toString('hex');
  } else {
    cached = 'dyp-farms-dev-secret-key';
  }
  return cached;
}
