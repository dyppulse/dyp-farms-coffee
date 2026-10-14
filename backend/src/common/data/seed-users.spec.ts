import { users } from './seed.data';
import { buildSeedUsers } from './seed-users';

const env = (vars: Record<string, string>) => vars as NodeJS.ProcessEnv;

describe('buildSeedUsers', () => {
  it('loads every demo user, hashed, outside production', () => {
    const result = buildSeedUsers(users, env({ NODE_ENV: 'development' }));
    expect(result.map((u) => u.role).sort()).toEqual([
      'admin',
      'farmer',
      'roaster',
      'tourist',
    ]);
    expect(result.every((u) => u.password.startsWith('scrypt$'))).toBe(true);
  });

  it('never loads the demo admin in production', () => {
    const result = buildSeedUsers(users, env({ NODE_ENV: 'production' }));
    expect(result.some((u) => u.role === 'admin')).toBe(false);
    expect(result.some((u) => u.email === 'admin@dypfarms.com')).toBe(false);
  });

  it('creates an admin in production only from ADMIN_EMAIL / ADMIN_PASSWORD', () => {
    const result = buildSeedUsers(
      users,
      env({
        NODE_ENV: 'production',
        ADMIN_EMAIL: 'Ops@Example.com',
        ADMIN_PASSWORD: 'a-long-passphrase',
      }),
    );
    const admin = result.find((u) => u.role === 'admin');
    expect(admin?.email).toBe('ops@example.com');
    expect(admin?.password).not.toContain('a-long-passphrase');
  });

  it('refuses a short ADMIN_PASSWORD', () => {
    const spy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const result = buildSeedUsers(
      users,
      env({
        NODE_ENV: 'production',
        ADMIN_EMAIL: 'ops@example.com',
        ADMIN_PASSWORD: 'short',
      }),
    );
    expect(result.some((u) => u.role === 'admin')).toBe(false);
    spy.mockRestore();
  });

  it('SEED_DEMO_USERS=false drops the farmer/buyer/tourist demos', () => {
    const result = buildSeedUsers(
      users,
      env({ NODE_ENV: 'production', SEED_DEMO_USERS: 'false' }),
    );
    expect(result).toHaveLength(0);
  });
});
