import { hashPasswordSync } from '../../auth/password';
import { User } from '../interfaces';

const MIN_ADMIN_PASSWORD_LENGTH = 12;

/**
 * Builds the in-memory user list at boot, with every password hashed.
 *
 * - Outside production, all seed users load (including the demo admin) so local dev and
 *   tests keep working.
 * - In production the demo admin is never loaded. An admin only exists if ADMIN_EMAIL and
 *   ADMIN_PASSWORD are set in the environment (the password must be 12+ characters).
 * - The farmer/buyer/tourist demo accounts load unless SEED_DEMO_USERS=false.
 */
export function buildSeedUsers(
  seed: User[],
  env: NodeJS.ProcessEnv = process.env,
): User[] {
  const production = env.NODE_ENV === 'production';
  const demoEnabled = env.SEED_DEMO_USERS !== 'false';

  const result: User[] = [];
  for (const user of seed) {
    if (user.role === 'admin' ? production : !demoEnabled) continue;
    result.push({ ...user, password: hashPasswordSync(user.password) });
  }

  if (production && env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    if (env.ADMIN_PASSWORD.length < MIN_ADMIN_PASSWORD_LENGTH) {
      console.error(
        `[auth] ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters — no admin account was created.`,
      );
    } else {
      result.push({
        id: 'admin-env',
        email: env.ADMIN_EMAIL.trim().toLowerCase(),
        password: hashPasswordSync(env.ADMIN_PASSWORD),
        name: 'Platform Admin',
        role: 'admin',
        createdAt: new Date().toISOString(),
      });
    }
  }

  return result;
}
