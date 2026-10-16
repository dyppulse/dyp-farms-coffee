import { HttpException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StoreService } from '../common/data/store.service';
import { users as seedUsers } from '../common/data/seed.data';
import { buildSeedUsers } from '../common/data/seed-users';
import { User } from '../common/interfaces';
import { AuthService } from './auth.service';

/** In-memory stand-in for the user part of the Prisma-backed StoreService. */
class FakeUserStore {
  users: User[] = buildSeedUsers(seedUsers, {} as NodeJS.ProcessEnv);

  async findUserByEmail(email: string) {
    return this.users.find((u) => u.email === email);
  }

  async createUser(data: Omit<User, 'id' | 'createdAt'>) {
    const user = {
      ...data,
      id: `user-${this.users.length + 1}`,
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    return user;
  }
}

function makeService() {
  const store = new FakeUserStore();
  const jwt = new JwtService({ secret: 'test-secret' });
  return { service: new AuthService(store as unknown as StoreService, jwt), store, jwt };
}

describe('AuthService', () => {
  it('logs in a seeded user and the stored password is a hash', async () => {
    const { service, store } = makeService();
    expect((await store.findUserByEmail('buyer@dypfarms.com'))?.password).toMatch(
      /^scrypt\$/,
    );
    const res = await service.login({
      email: 'buyer@dypfarms.com',
      password: 'password123',
    });
    expect(res.user.role).toBe('roaster');
    expect(res.accessToken).toEqual(expect.any(String));
  });

  it('treats the email case-insensitively', async () => {
    const { service } = makeService();
    const res = await service.login({
      email: ' Buyer@DypFarms.com ',
      password: 'password123',
    });
    expect(res.user.email).toBe('buyer@dypfarms.com');
  });

  it('rejects a wrong password and an unknown email with the same error', async () => {
    const { service } = makeService();
    const wrong = service.login({
      email: 'buyer@dypfarms.com',
      password: 'nope',
    });
    const unknown = service.login({
      email: 'nobody@example.com',
      password: 'nope',
    });
    await expect(wrong).rejects.toThrow(
      new UnauthorizedException('Invalid credentials'),
    );
    await expect(unknown).rejects.toThrow(
      new UnauthorizedException('Invalid credentials'),
    );
  });

  it('locks an account after 5 failures — even for the right password — then returns 429', async () => {
    const { service } = makeService();
    for (let i = 0; i < 5; i++) {
      await expect(
        service.login(
          { email: 'farmer@dypfarms.com', password: 'bad' },
          '10.0.0.1',
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    }
    const locked = service.login(
      { email: 'farmer@dypfarms.com', password: 'password123' },
      '10.0.0.2',
    );
    await expect(locked).rejects.toBeInstanceOf(HttpException);
    await expect(locked).rejects.toMatchObject({ status: 429 });
  });

  it('a successful login clears earlier failures', async () => {
    const { service } = makeService();
    for (let i = 0; i < 4; i++) {
      await expect(
        service.login({ email: 'tourist@dypfarms.com', password: 'bad' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    }
    await service.login({
      email: 'tourist@dypfarms.com',
      password: 'password123',
    });
    await expect(
      service.login({ email: 'tourist@dypfarms.com', password: 'bad' }),
    ).rejects.toBeInstanceOf(UnauthorizedException); // 1 failure, not locked
  });

  it('signs up with a hashed password, normalised email, and rejects duplicates', async () => {
    const { service, store } = makeService();
    await service.signUp({
      email: 'New.User@Example.com',
      password: 'longenough1',
      name: 'New',
    });
    const stored = await store.findUserByEmail('new.user@example.com');
    expect(stored?.password).toMatch(/^scrypt\$/);
    expect(stored?.password).not.toContain('longenough1');
    await expect(
      service.signUp({
        email: 'new.user@example.com',
        password: 'longenough1',
        name: 'Dup',
      }),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      service.login({ email: 'new.user@example.com', password: 'longenough1' }),
    ).resolves.toBeDefined();
  });

  it('limits sign-ups per IP', async () => {
    const { service } = makeService();
    for (let i = 0; i < 10; i++) {
      await service.signUp(
        { email: `u${i}@example.com`, password: 'longenough1', name: 'U' },
        '9.9.9.9',
      );
    }
    await expect(
      service.signUp(
        { email: 'u11@example.com', password: 'longenough1', name: 'U' },
        '9.9.9.9',
      ),
    ).rejects.toMatchObject({ status: 429 });
  });
});
