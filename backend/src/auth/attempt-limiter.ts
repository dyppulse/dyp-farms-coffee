interface Options {
  /** Attempts allowed inside the window before the key is locked. */
  max: number;
  windowMs: number;
  lockMs: number;
}

interface Entry {
  count: number;
  windowStart: number;
  lockedUntil: number;
}

const MAX_KEYS = 10_000;

/**
 * Small in-memory attempt counter (per process — fine here since the API is a single
 * instance with in-memory state anyway). `hit` records an attempt; once `max` attempts
 * land inside the window the key is locked for `lockMs`.
 */
export class AttemptLimiter {
  private entries = new Map<string, Entry>();

  constructor(private options: Options) {}

  /** Seconds left on the lock for this key, or 0 if it isn't locked. */
  lockedFor(key: string, now = Date.now()): number {
    const entry = this.entries.get(key);
    if (!entry || entry.lockedUntil <= now) return 0;
    return Math.ceil((entry.lockedUntil - now) / 1000);
  }

  hit(key: string, now = Date.now()): void {
    if (this.entries.size >= MAX_KEYS) this.prune(now);
    let entry = this.entries.get(key);
    if (
      !entry ||
      now - entry.windowStart > this.options.windowMs ||
      (entry.lockedUntil !== 0 && entry.lockedUntil <= now)
    ) {
      entry = { count: 0, windowStart: now, lockedUntil: 0 };
    }
    entry.count += 1;
    if (entry.count >= this.options.max) {
      entry.lockedUntil = now + this.options.lockMs;
    }
    this.entries.set(key, entry);
  }

  reset(key: string): void {
    this.entries.delete(key);
  }

  private prune(now: number) {
    for (const [key, entry] of this.entries) {
      const expired =
        entry.lockedUntil > 0
          ? entry.lockedUntil <= now
          : now - entry.windowStart > this.options.windowMs;
      if (expired) this.entries.delete(key);
    }
    // Still full of live entries (e.g. a flood): drop the oldest to stay bounded.
    if (this.entries.size >= MAX_KEYS) {
      for (const key of this.entries.keys()) {
        this.entries.delete(key);
        break;
      }
    }
  }
}
