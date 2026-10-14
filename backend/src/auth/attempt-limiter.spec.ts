import { AttemptLimiter } from './attempt-limiter';

describe('AttemptLimiter', () => {
  const opts = { max: 3, windowMs: 1000, lockMs: 5000 };

  it('locks a key after max attempts and reports the remaining seconds', () => {
    const limiter = new AttemptLimiter(opts);
    limiter.hit('a', 0);
    limiter.hit('a', 10);
    expect(limiter.lockedFor('a', 20)).toBe(0);
    limiter.hit('a', 20);
    expect(limiter.lockedFor('a', 20)).toBe(5);
    expect(limiter.lockedFor('a', 3000)).toBe(3);
  });

  it('unlocks once the lock expires and starts a fresh count', () => {
    const limiter = new AttemptLimiter(opts);
    for (let i = 0; i < 3; i++) limiter.hit('a', i);
    expect(limiter.lockedFor('a', 6000)).toBe(0);
    limiter.hit('a', 6000);
    limiter.hit('a', 6001);
    expect(limiter.lockedFor('a', 6002)).toBe(0);
  });

  it('forgets attempts that fall outside the window', () => {
    const limiter = new AttemptLimiter(opts);
    limiter.hit('a', 0);
    limiter.hit('a', 1);
    limiter.hit('a', 2000); // window expired, count restarts at 1
    expect(limiter.lockedFor('a', 2001)).toBe(0);
  });

  it('keeps keys independent and supports reset', () => {
    const limiter = new AttemptLimiter(opts);
    for (let i = 0; i < 3; i++) limiter.hit('a', i);
    expect(limiter.lockedFor('b', 10)).toBe(0);
    limiter.reset('a');
    expect(limiter.lockedFor('a', 10)).toBe(0);
  });
});
