export interface AutoBidLimit {
  userId: string;
  bidderName: string;
  maxAmount: number;
}

export interface PlannedBid {
  userId: string;
  bidderName: string;
  amount: number;
}

export const AUTO_BID_INCREMENT = 100;

/**
 * Given the auction state after a manual bid, returns the follow-up bids that
 * competing auto-bid limits place, in order. Pure so it can be unit-tested and
 * run inside a DB transaction.
 */
export function planAutoBids(
  currentBid: number,
  topBidderId: string | undefined,
  limits: AutoBidLimit[],
): PlannedBid[] {
  const planned: PlannedBid[] = [];
  let current = currentBid;
  let top = topBidderId;
  let changed = true;
  while (changed) {
    changed = false;
    for (const limit of limits) {
      if (limit.userId === top) continue;
      const next = Math.min(limit.maxAmount, current + AUTO_BID_INCREMENT);
      if (next > current) {
        planned.push({
          userId: limit.userId,
          bidderName: limit.bidderName,
          amount: next,
        });
        current = next;
        top = limit.userId;
        changed = true;
        break;
      }
    }
  }
  return planned;
}
