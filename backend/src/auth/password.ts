import {
  randomBytes,
  scrypt,
  scryptSync,
  timingSafeEqual,
  type ScryptOptions,
} from 'crypto';

// scrypt ships with Node, so there's no native module to build on Render. Stored as
// `scrypt$<N>$<salt b64>$<hash b64>` so the cost can be raised later without breaking
// existing hashes.
const KEY_LENGTH = 64;
const COST = 16384;

function derive(
  plain: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(plain, salt, keyLength, options, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

function encode(salt: Buffer, hash: Buffer): string {
  return `scrypt$${COST}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  return encode(salt, await derive(plain, salt, KEY_LENGTH, { N: COST }));
}

/** Blocking variant — only for one-off seeding at startup. */
export function hashPasswordSync(plain: string): string {
  const salt = randomBytes(16);
  return encode(salt, scryptSync(plain, salt, KEY_LENGTH, { N: COST }));
}

export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<boolean> {
  const [scheme, cost, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !cost || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await derive(
    plain,
    Buffer.from(salt, 'base64'),
    expected.length,
    {
      N: Number(cost),
    },
  );
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
