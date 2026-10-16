import { planAutoBids } from './auction-engine';

describe('planAutoBids', () => {
  it('does nothing without competing limits', () => {
    expect(planAutoBids(1000, 'a', [])).toEqual([]);
    expect(
      planAutoBids(1000, 'a', [{ userId: 'a', bidderName: 'A', maxAmount: 9000 }]),
    ).toEqual([]);
  });

  it('counters a rival up to its maximum and no further', () => {
    // Auto-bidder ceiling 1200; rival then bids 1300 and stays on top.
    const planned = planAutoBids(1300, 'rival', [
      { userId: 'auto', bidderName: 'Auto', maxAmount: 1200 },
    ]);
    expect(planned).toEqual([]);
  });

  it('auto-bidder outbids a rival in 100 increments, capped at its max', () => {
    const planned = planAutoBids(1000, 'rival', [
      { userId: 'auto', bidderName: 'Auto', maxAmount: 1250 },
    ]);
    expect(planned).toEqual([{ userId: 'auto', bidderName: 'Auto', amount: 1100 }]);
  });

  it('two auto-bidders bid each other up until the lower ceiling is exhausted', () => {
    const planned = planAutoBids(1000, 'manual', [
      { userId: 'a', bidderName: 'A', maxAmount: 1300 },
      { userId: 'b', bidderName: 'B', maxAmount: 1500 },
    ]);
    const last = planned[planned.length - 1];
    expect(last).toEqual({ userId: 'b', bidderName: 'B', amount: 1400 });
    expect(planned.every((p, i) => i === 0 || p.amount > planned[i - 1].amount)).toBe(true);
  });
});
