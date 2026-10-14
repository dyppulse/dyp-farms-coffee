import { hashPassword, hashPasswordSync, verifyPassword } from './password';

describe('password hashing', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(await verifyPassword('correct horse battery', hash)).toBe(true);
    expect(await verifyPassword('wrong password', hash)).toBe(false);
  });

  it('never stores the plaintext and salts every hash', async () => {
    const a = await hashPassword('same-password');
    const b = await hashPassword('same-password');
    expect(a).not.toContain('same-password');
    expect(a).not.toEqual(b);
  });

  it('sync and async hashes are interchangeable', async () => {
    expect(
      await verifyPassword('pw-12345678', hashPasswordSync('pw-12345678')),
    ).toBe(true);
  });

  it('rejects malformed or legacy plaintext values instead of throwing', async () => {
    expect(await verifyPassword('password123', 'password123')).toBe(false);
    expect(await verifyPassword('x', 'scrypt$16384$only-two-parts')).toBe(
      false,
    );
    expect(await verifyPassword('x', '')).toBe(false);
  });
});
