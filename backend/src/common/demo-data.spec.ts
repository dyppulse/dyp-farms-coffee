import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { verifyPassword } from '../auth/password';
import { DEMO_EMAIL_DOMAIN, DEMO_ID_PREFIX, DemoData } from './data/demo-data.types';
import { DISTRICTS, UGANDA_BOUNDS } from '../../prisma/demo/uganda-districts';

const dir = join(__dirname, '..', '..', 'prisma', 'demo');
const dataFile = join(dir, 'demo-data.json');
const describeData = existsSync(dataFile) ? describe : describe.skip;

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const dLat = (bLat - aLat) * 111.32;
  const dLng = (bLng - aLng) * 111.32 * Math.cos((((aLat + bLat) / 2) * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

/** Polygon area in hectares (local flat approximation, fine for farm-sized shapes). */
function hectares(points: { lat: number; lng: number }[]) {
  const lat0 = points[0].lat;
  const xy = points.map((p) => ({ x: (p.lng - points[0].lng) * 111.32 * Math.cos((lat0 * Math.PI) / 180), y: (p.lat - lat0) * 111.32 }));
  let area = 0;
  xy.forEach((a, i) => {
    const b = xy[(i + 1) % xy.length];
    area += a.x * b.y - b.x * a.y;
  });
  return (Math.abs(area) / 2) * 100;
}

describeData('demo dataset (prisma/demo/demo-data.json)', () => {
  const data = JSON.parse(readFileSync(dataFile, 'utf8')) as DemoData;
  const byId = <T extends { id: string }>(rows: T[]) => new Map(rows.map((r) => [r.id, r]));
  const users = byId(data.users);
  const lots = byId(data.lots);
  const farms = byId(data.farms);
  const receipts = byId(data.receipts);

  it('has 1,000 farmers plus buyers and tourists, all on the demo email domain', () => {
    const count = (role: string) => data.users.filter((u) => u.role === role).length;
    expect(count('farmer')).toBe(1000);
    expect(count('roaster')).toBeGreaterThanOrEqual(50);
    expect(count('tourist')).toBeGreaterThanOrEqual(20);
    expect(data.users.every((u) => u.email.endsWith(`@${DEMO_EMAIL_DOMAIN}`))).toBe(true);
  });

  it('uses unique ids and emails, and every id is demo-prefixed so it can be removed', () => {
    for (const rows of [data.users, data.farms, data.lots, data.auctions, data.receipts, data.financing, data.posts, data.subscriptions, data.tickets, data.notifications]) {
      const ids = rows.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => id.startsWith(DEMO_ID_PREFIX))).toBe(true);
    }
    expect(new Set(data.users.map((u) => u.email)).size).toBe(data.users.length);
  });

  it('spreads farmers over many districts in all four regions', () => {
    const districts = new Set(data.users.filter((u) => u.role === 'farmer').map((u) => u.district));
    expect(districts.size).toBeGreaterThanOrEqual(50);
    const regions = new Set([...districts].map((d) => DISTRICTS.find((x) => x.name === d)?.region));
    expect(regions).toEqual(new Set(['Central', 'Western', 'Eastern', 'Northern']));
  });

  it('places every farm inside Uganda, near its district, with a matching area', () => {
    for (const farm of data.farms) {
      const owner = users.get(farm.ownerId)!;
      const district = DISTRICTS.find((d) => d.name === owner.district)!;
      expect(district).toBeDefined();
      expect(farm.boundary.length).toBeGreaterThanOrEqual(4);
      for (const p of farm.boundary) {
        expect(p.lat).toBeGreaterThan(UGANDA_BOUNDS.minLat);
        expect(p.lat).toBeLessThan(UGANDA_BOUNDS.maxLat);
        expect(p.lng).toBeGreaterThan(UGANDA_BOUNDS.minLng);
        expect(p.lng).toBeLessThan(UGANDA_BOUNDS.maxLng);
        expect(distanceKm(p.lat, p.lng, district.lat, district.lng)).toBeLessThan(district.spreadKm + 1.5);
      }
      expect(Math.abs(hectares(farm.boundary) - farm.sizeHectares)).toBeLessThan(Math.max(0.05, farm.sizeHectares * 0.03));
    }
  });

  it('gives harvest-ready lots a real farmer, farm, price and quantity', () => {
    expect(data.lots.length).toBeGreaterThanOrEqual(400);
    for (const lot of data.lots) {
      expect(users.get(lot.farmerId)?.role).toBe('farmer');
      expect(farms.get(lot.farmId)?.ownerId).toBe(lot.farmerId);
      expect(lot.price).toBeGreaterThan(2.5);
      expect(lot.price).toBeLessThan(10);
      expect(lot.quantity).toBeGreaterThanOrEqual(100);
      expect(lot.warehouse).toMatch(/Hub$/);
    }
    expect(data.lots.some((l) => !l.inAuction)).toBe(true);
  });

  it('has open and finished auctions whose bids climb and match the current bid', () => {
    const active = data.auctions.filter((a) => a.status === 'active');
    const ended = data.auctions.filter((a) => a.status === 'ended');
    expect(active.length).toBeGreaterThan(100);
    expect(ended.length).toBeGreaterThan(30);
    expect(active.some((a) => a.bids.length === 0)).toBe(true); // opening-price auctions to test a first bid
    expect(active.some((a) => a.autoBids.length > 0)).toBe(true);
    for (const a of data.auctions) {
      const lot = lots.get(a.lotId)!;
      expect(lot.inAuction).toBe(true);
      let previous = lot.price;
      for (const bid of a.bids) {
        expect(users.get(bid.userId)?.role).toBe('roaster');
        expect(bid.amount).toBeGreaterThan(previous);
        previous = bid.amount;
      }
      expect(a.currentBid).toBe(a.bids.length ? a.bids[a.bids.length - 1].amount : lot.price);
      // bids are ordered oldest to newest, and ended auctions closed after their last bid
      const times = a.bids.map((b) => b.minutesAgo);
      expect([...times].sort((x, y) => y - x)).toEqual(times);
      if (a.status === 'ended' && a.bids.length) expect(a.bids[a.bids.length - 1].minutesAgo).toBeGreaterThanOrEqual(a.endedDaysAgo * 1440);
    }
    expect(data.lots.filter((l) => l.inAuction).length).toBe(data.auctions.length);
  });

  it('keeps receipts and loans consistent: 20-80% of value, one open loan per receipt', () => {
    expect(data.receipts.length).toBeGreaterThan(50);
    const open = new Set<string>();
    for (const loan of data.financing) {
      const receipt = receipts.get(loan.receiptId)!;
      expect(receipt.userId).toBe(loan.userId);
      expect(receipt.lotId).toBe(loan.lotId);
      expect(loan.requestedAmount).toBeGreaterThanOrEqual(receipt.estimatedValue * 0.2);
      expect(loan.requestedAmount).toBeLessThanOrEqual(receipt.estimatedValue * 0.8);
      expect(open.has(loan.receiptId)).toBe(false);
      open.add(loan.receiptId);
    }
    expect(new Set(data.financing.map((f) => f.status)).size).toBeGreaterThanOrEqual(3);
  });

  it('has at most one live subscription per person', () => {
    const live = data.subscriptions.filter((s) => s.status !== 'cancelled').map((s) => s.userId);
    expect(new Set(live).size).toBe(live.length);
  });

  it('has community posts whose like counts are real and whose authors exist', () => {
    for (const post of data.posts) {
      expect(users.has(post.userId)).toBe(true);
      expect(new Set(post.likeUserIds).size).toBe(post.likeUserIds.length);
      post.likeUserIds.forEach((id) => expect(users.has(id)).toBe(true));
    }
  });

  it('lists every account in DEMO_LOGINS.txt and the passwords match the stored hashes', async () => {
    const lines = readFileSync(join(dir, 'DEMO_LOGINS.txt'), 'utf8')
      .split('\n')
      .filter((l) => l && !l.startsWith('#') && !l.startsWith('##'));
    expect(lines).toHaveLength(data.users.length);
    const rows = lines.map((l) => l.split('\t'));
    expect(new Set(rows.map((r) => r[1])).size).toBe(rows.length); // every password is different
    for (const [email, password] of rows) expect(password).toMatch(/^[A-Za-z0-9]{12}$/);
    // Check a spread of accounts (hashing is slow by design).
    for (const row of rows.filter((_, i) => i % 97 === 0)) {
      const user = data.users.find((u) => u.email === row[0])!;
      expect(await verifyPassword(row[1], user.passwordHash)).toBe(true);
    }
  });
});
