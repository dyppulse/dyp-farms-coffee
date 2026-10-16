import type { Transaction } from "../api/client";

export type TopUpOutcome = "completed" | "failed" | "timeout";

/** Polls a pending top-up until the provider settles it or attempts run out. */
export async function pollTopUp(
  poll: () => Promise<{ transaction: Transaction }>,
  {
    attempts = 20,
    intervalMs = 3000,
    sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)),
  } = {},
): Promise<TopUpOutcome> {
  for (let i = 0; i < attempts; i++) {
    try {
      const { transaction } = await poll();
      if (transaction.status === "completed") return "completed";
      if (transaction.status === "failed") return "failed";
    } catch {
      // transient network error: keep polling
    }
    if (i < attempts - 1) await sleep(intervalMs);
  }
  return "timeout";
}

export function isValidPhone(phone: string): boolean {
  return /^\+?\d{10,15}$/.test(phone.replace(/[\s-]/g, ""));
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, "").replace(/^\+/, "");
}
