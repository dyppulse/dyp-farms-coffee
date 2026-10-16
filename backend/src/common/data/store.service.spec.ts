import { StoreService } from './store.service';

describe('StoreService auctions', () => {
  let store: StoreService;
  beforeEach(() => {
    store = new StoreService();
  });

  const lotId = () => store.getAuctions()[0].lotId;

  it('rejects a bid at or below the current bid', () => {
    const current = store.getAuctions()[0].currentBid;
    expect(() => store.placeBid(lotId(), 'u1', 'Ann', current)).toThrow(
      'Bid must be higher than current bid',
    );
  });

  it('records a higher bid and raises the current bid', () => {
    const before = store.getAuctions()[0].currentBid;
    store.placeBid(lotId(), 'u1', 'Ann', before + 500);
    const after = store.getAuctions()[0];
    expect(after.currentBid).toBe(before + 500);
    expect(after.bids[0].userId).toBe('u1');
  });

  it('rejects bids on an unknown auction', () => {
    expect(() => store.placeBid('nope', 'u1', 'Ann', 99999)).toThrow('Auction not found');
  });

  it('auto-bid counters a rival up to its maximum and no further', () => {
    const before = store.getAuctions()[0].currentBid;
    store.placeBid(lotId(), 'auto-user', 'Auto', before + 200, true);
    store.placeBid(lotId(), 'rival', 'Rival', before + 300);
    const auction = store.getAuctions()[0];
    // The auto-bidder's ceiling is before + 200, so the rival stays on top.
    expect(auction.bids[0].userId).toBe('rival');
    expect(auction.currentBid).toBe(before + 300);
  });
});

describe('StoreService wallet', () => {
  let store: StoreService;
  beforeEach(() => {
    store = new StoreService();
  });

  it('adds funds and records the deposit', () => {
    const start = store.getWalletBalance('user-1');
    store.addFunds('user-1', 1000);
    expect(store.getWalletBalance('user-1')).toBe(start + 1000);
    expect(store.getWalletTransactions('user-1')[0].type).toBe('deposit');
  });

  it('refuses to withdraw more than the balance', () => {
    const start = store.getWalletBalance('user-1');
    expect(() => store.withdraw('user-1', start + 1)).toThrow('Insufficient balance');
    expect(store.getWalletBalance('user-1')).toBe(start);
  });

  it('withdraws within the balance', () => {
    store.addFunds('user-1', 5000);
    const start = store.getWalletBalance('user-1');
    store.withdraw('user-1', 2000);
    expect(store.getWalletBalance('user-1')).toBe(start - 2000);
  });
});
