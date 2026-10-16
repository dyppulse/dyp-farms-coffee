// Generates the demo dataset: 1,000 farmers across Uganda with farms, lots, auctions, bids and more.
//
//   npm run demo:generate
//
// Writes prisma/demo/demo-data.json (committed, loaded by the seeder) and
// prisma/demo/DEMO_LOGINS.txt (committed, plaintext logins for TEST accounts only).
// Everything except the password hashes is deterministic: the same seed gives the same
// people, places and lots. Passwords are random per run, so only regenerate on purpose.
import { randomInt } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { hashPassword } from '../../src/auth/password';
import {
  DemoAuction,
  DemoBid,
  DemoData,
  DemoFarm,
  DemoFinancing,
  DemoLot,
  DemoNotification,
  DemoPost,
  DemoReceipt,
  DemoSubscription,
  DemoTicket,
  DemoUser,
  DEMO_EMAIL_DOMAIN,
} from '../../src/common/data/demo-data.types';
import {
  BUYER_COMPANIES,
  BUYER_FAMILY,
  BUYER_FIRST,
  NAMES,
  TOURIST_FAMILY,
  TOURIST_FIRST,
} from './names';
import { DISTRICTS, District, HUBS } from './uganda-districts';

const SEED = 20261016;
const FARMERS = 1000;
const BUYERS = 60;
const TOURISTS = 30;

// ───── random helpers (deterministic) ─────
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const between = (min: number, max: number) => min + rand() * (max - min);
const int = (min: number, max: number) => Math.floor(between(min, max + 1));
const pick = <T>(items: readonly T[]): T => items[Math.floor(rand() * items.length)];
const chance = (p: number) => rand() < p;
const round = (n: number, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;
function weighted<T>(items: readonly T[], weight: (item: T) => number): T {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let roll = rand() * total;
  for (const item of items) {
    roll -= weight(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}
function sample<T>(items: readonly T[], count: number): T[] {
  const copy = [...items];
  const out: T[] = [];
  while (out.length < count && copy.length) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  return out;
}
const pad = (n: number, width = 4) => String(n).padStart(width, '0');
const slug = (text: string) => text.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');

// ───── geography ─────
const KM_PER_DEG_LAT = 111.32;

function kmToDeg(lat: number, northKm: number, eastKm: number) {
  return { dLat: northKm / KM_PER_DEG_LAT, dLng: eastKm / (KM_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180)) };
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const dLat = (bLat - aLat) * KM_PER_DEG_LAT;
  const dLng = (bLng - aLng) * KM_PER_DEG_LAT * Math.cos((((aLat + bLat) / 2) * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

/** Polygon around a centre with the requested area (hectares), as lat/lng points. */
function farmPolygon(centerLat: number, centerLng: number, hectares: number) {
  const vertices = int(4, 6);
  const baseRadiusKm = Math.sqrt((hectares * 0.01) / Math.PI);
  const turn = rand() * Math.PI * 2;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < vertices; i++) {
    const angle = turn + (i / vertices) * Math.PI * 2 + between(-0.25, 0.25);
    const r = baseRadiusKm * between(0.8, 1.2);
    points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
  }
  // Rescale so the polygon area matches the target exactly (shoelace, km²).
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  area = Math.abs(area) / 2;
  const scale = Math.sqrt((hectares * 0.01) / area);
  const boundary = points.map((p) => {
    const { dLat, dLng } = kmToDeg(centerLat, p.y * scale, p.x * scale);
    return { lat: round(centerLat + dLat, 6), lng: round(centerLng + dLng, 6) };
  });
  return { boundary, hectares: round((area * scale * scale) / 0.01, 2) };
}

function farmCentre(district: District) {
  const r = district.spreadKm * Math.sqrt(rand());
  const theta = rand() * Math.PI * 2;
  const { dLat, dLng } = kmToDeg(district.lat, r * Math.sin(theta), r * Math.cos(theta));
  return { lat: district.lat + dLat, lng: district.lng + dLng };
}

const nearestHub = (lat: number, lng: number) =>
  HUBS.reduce((best, hub) => (distanceKm(lat, lng, hub.lat, hub.lng) < distanceKm(lat, lng, best.lat, best.lng) ? hub : best)).name;

// ───── coffee ─────
type GradeInfo = { grade: string; min: number; max: number; weight: number };
const GRADES: Record<'robusta' | 'arabica', GradeInfo[]> = {
  robusta: [
    { grade: 'Screen 18', min: 4.4, max: 5.4, weight: 2 },
    { grade: 'Screen 15', min: 4.0, max: 4.8, weight: 3 },
    { grade: 'FAQ', min: 3.6, max: 4.4, weight: 5 },
    { grade: 'Kiboko', min: 3.0, max: 3.6, weight: 1 },
  ],
  arabica: [
    { grade: 'Bugisu AA', min: 6.8, max: 9.0, weight: 2 },
    { grade: 'Bugisu A', min: 6.2, max: 8.0, weight: 3 },
    { grade: 'Bugisu AB', min: 5.6, max: 7.0, weight: 3 },
    { grade: 'Wugar', min: 6.0, max: 8.0, weight: 2 },
    { grade: 'Drugar', min: 5.2, max: 6.5, weight: 2 },
  ],
};
const VARIETIES = {
  robusta: ['Nganda', 'Kituza clone', 'Erecta', 'Mixed robusta'],
  arabica: ['SL14', 'SL28', 'Bourbon', 'Typica', 'Nyasaland'],
};
const PROCESSES = ['Washed', 'Natural', 'Honey'];
const NOTES = {
  robusta: ['Dark chocolate, roasted nuts, full body', 'Cocoa, malt, low acidity', 'Woody, earthy, caramel sweetness', 'Peanut, spice, heavy body, long finish', 'Bittersweet chocolate and tobacco'],
  arabica: ['Blackcurrant, citrus, bright acidity', 'Red apple, brown sugar, silky body', 'Floral, berry, winey finish', 'Orange peel, honey, balanced acidity', 'Cherry, cocoa, clean cup'],
};

// ───── text for community, tickets ─────
const POSTS: { category: DemoPost['category']; title: string; content: string }[] = [
  { category: 'tips', title: 'Drying parchment evenly on raised beds', content: 'I moved from tarpaulins to raised mesh beds this season. Turning every hour in the first three days gave an even dry and no mould. Moisture came out at 11.5%.' },
  { category: 'tips', title: 'Mulching banana trash around coffee', content: 'Using banana trash as mulch kept moisture in the dry spell and the soil stayed cooler. Yield on that plot was clearly better than the bare one.' },
  { category: 'question', title: 'How do you handle coffee wilt disease?', content: 'Three trees in my lower plot have wilted and the leaves are yellowing from the top. Should I uproot them now or wait? Anyone dealt with this recently?' },
  { category: 'question', title: 'Best time to prune robusta?', content: 'We just finished the main harvest. Is it better to prune straight away or wait for the first rains?' },
  { category: 'discussion', title: 'Prices at the hub this week', content: 'FAQ was moving a little higher at the hub this week. Are you holding stock or selling now? I am waiting one more week.' },
  { category: 'news', title: 'Farmers group formed in our sub-county', content: 'We registered a small farmers group of 40 members to sell together and share a drying yard. Happy to share how we set it up.' },
  { category: 'tips', title: 'Shade trees that worked for us', content: 'Planting Grevillea and Albizia at wide spacing gave good shade without cutting yields. We also use them for firewood so less pressure on the forest.' },
  { category: 'question', title: 'Is the quality scan reliable?', content: 'I scanned the same bag twice and got A once and B once. How do you take the photo so the grade is steady?' },
  { category: 'discussion', title: 'Intercropping coffee with beans', content: 'Beans between young coffee rows gave us food and income in the first two years. The only trouble was keeping beans from shading the seedlings.' },
  { category: 'news', title: 'Rains came early this season', content: 'Heavy rain started two weeks earlier than usual in our area. Flowering looks strong but picking will be late. How is it where you are?' },
  { category: 'tips', title: 'Sorting cherries before drying', content: 'Floating the cherries removes the light ones. It takes ten extra minutes per sack and the buyer cup scores went up.' },
  { category: 'question', title: 'How do I request financing against my receipt?', content: 'I have a warehouse receipt and want a short loan to pay pickers. Which screen do I use and how long does approval take?' },
  { category: 'discussion', title: 'Mobile money fees for farmers', content: 'The fees on larger payments add up. Do any of you split payouts across the week to keep fees lower?' },
  { category: 'tips', title: 'Storing parchment off the floor', content: 'Wooden pallets and a gap from the wall in our store stopped the damp getting to the bags. Simple and cheap.' },
  { category: 'question', title: 'Coffee berry borer in the lower plot', content: 'I found small holes in many cherries. Is trapping worth it or should I harvest early and clean the field?' },
];
const REPLIES = [
  'Thanks for sharing, this is useful.',
  'Same experience here. It made a real difference for us.',
  'We tried this last season and it worked well.',
  'Can you share more detail on how you set it up?',
  'Our extension officer suggested something similar.',
  'Good point. I will try it on a small plot first.',
  'Not sure this works at our altitude, but worth a test.',
  'Congratulations, that is a good result.',
  'Keep the cherries clean and dry and the price follows.',
  'Contact the district agriculture office, they helped us with this.',
];
const TICKETS: { subject: string; body: string; team: DemoTicket['team'] }[] = [
  { subject: 'My lot weight looks wrong', body: 'I listed 800 kg but the lot page shows 650 kg. Can someone check?', team: 'quality' },
  { subject: 'Cannot save my farm boundary', body: 'When I add the last point the map screen closes and nothing is saved.', team: 'engineering' },
  { subject: 'Grade lower than expected', body: 'The scan gave Screen 15 but my buyer graded it as Screen 18. Can I get a rescan?', team: 'quality' },
  { subject: 'How do I request financing?', body: 'I want a loan against my warehouse receipt. Where do I start?', team: null },
  { subject: 'Payout has not arrived', body: 'My lot sold last week and I have not received the payout yet.', team: 'payments' },
  { subject: 'Shipment tracking shows no update', body: 'The truck left the hub two days ago and the tracker has not moved.', team: 'logistics' },
  { subject: 'Weather alert for my area', body: 'I got a weather alert but my farm is in a different district. Please check my location.', team: 'agronomy' },
  { subject: 'App closes when I open the camera', body: 'On my phone the app closes when I tap scan. It worked last month.', team: 'engineering' },
];
const ADMIN_REPLIES = [
  'Thanks for reporting this. We are looking into it and will update you here.',
  'We have checked your account and fixed this. Please try again and tell us if it persists.',
  'Could you send a screenshot or the lot number so we can investigate?',
];

const PLANS = [
  { id: 'plan-starter', name: 'Starter', frequency: 'monthly' as const, price: 29.99 },
  { id: 'plan-enthusiast', name: 'Enthusiast', frequency: 'biweekly' as const, price: 59.99 },
  { id: 'plan-connoisseur', name: 'Connoisseur', frequency: 'weekly' as const, price: 99.99 },
];

const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const newPassword = () => Array.from({ length: 12 }, () => PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]).join('');

async function main() {
  const users: DemoUser[] = [];
  const logins: { email: string; password: string; role: string; name: string; district: string }[] = [];
  const usedEmails = new Set<string>();

  async function addUser(id: string, name: string, role: DemoUser['role'], emailBase: string, district = '') {
    let email = `${emailBase}@${DEMO_EMAIL_DOMAIN}`;
    for (let n = 2; usedEmails.has(email); n++) email = `${emailBase}${n}@${DEMO_EMAIL_DOMAIN}`;
    usedEmails.add(email);
    const password = newPassword();
    users.push({ id, email, name, role, passwordHash: await hashPassword(password), ...(district ? { district } : {}) });
    logins.push({ email, password, role, name, district });
    return users[users.length - 1];
  }

  // ───── farmers, farms ─────
  const farmers: { user: DemoUser; district: District }[] = [];
  const farms: DemoFarm[] = [];
  const farmCentres = new Map<string, { lat: number; lng: number; district: District }>();
  for (let i = 1; i <= FARMERS; i++) {
    const district = weighted(DISTRICTS, (x) => x.weight);
    const pool = NAMES[district.region];
    const female = chance(0.45);
    const given = pick(female ? pool.female : pool.male);
    const family = pick(pool.family);
    const user = await addUser(`demo-farmer-${pad(i)}`, `${given} ${family}`, 'farmer', `${slug(given)}.${slug(family)}${pad(i)}`, district.name);
    farmers.push({ user, district });

    const farmCount = weighted([1, 2, 3], (n) => (n === 1 ? 6 : n === 2 ? 3 : 1));
    for (let f = 1; f <= farmCount; f++) {
      const centre = farmCentre(district);
      const hectares = Math.min(15, Math.max(0.25, Math.exp(between(Math.log(0.4), Math.log(8)))));
      const { boundary, hectares: area } = farmPolygon(centre.lat, centre.lng, hectares);
      const id = `demo-farm-${pad(i)}-${f}`;
      const kind = pick(['Family Coffee Farm', 'Coffee Estate', 'Hillside Plot', 'Shamba', 'Coffee Gardens']);
      farms.push({ id, ownerId: user.id, name: `${family} ${kind} (${district.name})`, sizeHectares: area, boundary, daysAgo: int(10, 600) });
      farmCentres.set(id, { ...centre, district });
    }
  }

  // ───── buyers and tourists ─────
  const buyers: DemoUser[] = [];
  for (let i = 1; i <= BUYERS; i++) {
    const first = pick(BUYER_FIRST);
    const family = pick(BUYER_FAMILY);
    const company = chance(0.5) ? ` (${pick(BUYER_COMPANIES)})` : '';
    buyers.push(await addUser(`demo-buyer-${pad(i, 3)}`, `${first} ${family}${company}`, 'roaster', `${slug(first)}.${slug(family)}${pad(i, 3)}.buyer`));
  }
  const tourists: DemoUser[] = [];
  for (let i = 1; i <= TOURISTS; i++) {
    const first = pick(TOURIST_FIRST);
    const family = pick(TOURIST_FAMILY);
    tourists.push(await addUser(`demo-tourist-${pad(i, 3)}`, `${first} ${family}`, 'tourist', `${slug(first)}.${slug(family)}${pad(i, 3)}.tourist`));
  }

  // ───── lots: roughly 40% of farmers have a harvest ready ─────
  const lots: DemoLot[] = [];
  const lotFarm = new Map<string, DemoFarm>();
  let lotCounter = 0;
  for (const { user, district } of farmers) {
    if (!chance(0.4)) continue;
    const ownFarms = farms.filter((f) => f.ownerId === user.id);
    const lotCount = chance(0.45) ? 2 : 1;
    for (let l = 0; l < lotCount; l++) {
      const farm = pick(ownFarms);
      const centre = farmCentres.get(farm.id)!;
      const type = district.coffee.length > 1 && chance(0.3) ? district.coffee[1] : district.coffee[0];
      const gradeInfo = weighted(GRADES[type], (g) => g.weight);
      const variety = pick(VARIETIES[type]);
      const process = type === 'arabica' ? pick(PROCESSES) : pick(['Natural', 'Natural', 'Washed']);
      const harvestDaysAgo = int(2, 45);
      lotCounter++;
      const id = `demo-lot-${pad(lotCounter)}`;
      const quantity = Math.round(Math.min(6000, Math.max(100, Math.exp(between(Math.log(150), Math.log(3000))))) / 10) * 10;
      const hub = nearestHub(centre.lat, centre.lng);
      const lot: DemoLot = {
        id,
        name: `${district.name} ${variety} ${process}`,
        origin: `${district.name}, ${district.region} Uganda`,
        grade: gradeInfo.grade,
        price: round(between(gradeInfo.min, gradeInfo.max)),
        cuppingNotes: pick(NOTES[type]),
        traceability: `${farm.name}. GPS ${round(centre.lat, 4)}, ${round(centre.lng, 4)}. ${type === 'arabica' ? 'Arabica' : 'Robusta'}, about ${district.altitude} m. Harvested ${harvestDaysAgo} days before listing, ready for collection.`,
        warehouse: hub,
        quantity,
        unit: 'kg',
        farmerId: user.id,
        farmId: farm.id,
        inAuction: false,
        daysAgo: harvestDaysAgo,
      };
      lots.push(lot);
      lotFarm.set(id, farm);
    }
  }

  // ───── auctions and bids ─────
  const auctions: DemoAuction[] = [];
  const notifications: DemoNotification[] = [];
  let bidCounter = 0;
  const auctionLots = sample(lots, Math.round(lots.length * 0.46));
  auctionLots.forEach((lot, index) => {
    lot.inAuction = true;
    const ended = index % 100 < 30;
    const bidCount = ended ? int(3, 12) : chance(0.22) ? 0 : int(1, 14);
    const bidders = sample(buyers, Math.min(buyers.length, Math.max(2, Math.ceil(bidCount / 2))));
    const bids: DemoBid[] = [];
    let amount = lot.price;
    const endedDaysAgo = ended ? int(1, 30) : 0;
    const spanMinutes = ended ? int(1500, 6000) : int(120, 3600);
    for (let b = 0; b < bidCount; b++) {
      amount = round(amount + between(0.05, 0.25));
      const bidder = bids.length && chance(0.7) ? pick(bidders.filter((x) => x.id !== bids[bids.length - 1].userId) as DemoUser[]) : pick(bidders);
      bidCounter++;
      bids.push({
        id: `demo-bid-${pad(bidCounter, 5)}`,
        userId: bidder.id,
        bidderName: bidder.name,
        amount,
        // Ended auctions: every bid happened before the close, which was endedDaysAgo ago.
        minutesAgo: Math.round(spanMinutes * (1 - b / Math.max(1, bidCount)) + (ended ? endedDaysAgo * 1440 : 5)),
      });
    }
    const currentBid = bids.length ? bids[bids.length - 1].amount : lot.price;
    const autoBids: DemoAuction['autoBids'] = [];
    if (!ended && bids.length > 0 && chance(0.28)) {
      const holder = pick(bidders);
      autoBids.push({ userId: holder.id, bidderName: holder.name, maxAmount: round(currentBid + between(0.5, 2.0)) });
    }
    auctions.push({
      id: `demo-auction-${pad(index + 1)}`,
      lotId: lot.id,
      status: ended ? 'ended' : 'active',
      hoursLeft: ended ? 0 : round(between(2, 96), 1),
      endedDaysAgo,
      evergreen: !ended && chance(0.75),
      currentBid,
      bids,
      autoBids,
    });
    if (bids.length) {
      notifications.push({
        id: `demo-note-${pad(notifications.length + 1, 5)}`,
        userId: lot.farmerId,
        title: 'New bid on your lot',
        body: `${bids[bids.length - 1].bidderName} bid ${currentBid.toFixed(2)} on ${lot.name}`,
        entityType: 'auction',
        entityId: lot.id,
        read: chance(0.4),
        minutesAgo: bids[bids.length - 1].minutesAgo,
      });
    }
  });

  // ───── receipts and financing for lots that are not in auction ─────
  const receipts: DemoReceipt[] = [];
  const financing: DemoFinancing[] = [];
  const readyLots = lots.filter((l) => !l.inAuction);
  sample(readyLots, Math.round(readyLots.length * 0.55)).forEach((lot, i) => {
    const farm = lotFarm.get(lot.id)!;
    const centre = farmCentres.get(farm.id)!;
    const qualityScore = lot.grade.includes('AA') || lot.grade.includes('18') ? int(88, 96) : lot.grade.includes('FAQ') || lot.grade.includes('AB') ? int(72, 82) : int(80, 90);
    const receipt: DemoReceipt = {
      id: `demo-receipt-${pad(i + 1)}`,
      userId: lot.farmerId,
      lotId: lot.id,
      lotName: lot.name,
      variety: lot.name.split(' ').slice(1, -1).join(' ') || 'Mixed',
      quantity: lot.quantity,
      unit: 'kg',
      grade: lot.grade,
      moistureLevel: round(between(10.5, 12.5), 1),
      gpsLocation: { lat: round(centre.lat, 6), lng: round(centre.lng, 6) },
      qualityScore,
      storageLocation: lot.warehouse,
      estimatedValue: round(lot.price * lot.quantity * (qualityScore / 100)),
      daysAgo: Math.max(0, lot.daysAgo - int(0, 2)),
    };
    receipts.push(receipt);
    if (chance(0.45)) {
      const status = weighted<DemoFinancing['status']>(['pending', 'approved', 'rejected', 'funded'], (s) => (s === 'pending' ? 4 : s === 'approved' ? 3 : s === 'rejected' ? 2 : 3));
      const amount = Math.round(receipt.estimatedValue * between(0.25, 0.78));
      const duration = pick([3, 6, 9, 12]);
      const r = 8.5 / 100 / 12;
      const payment = (amount * r * (1 + r) ** duration) / ((1 + r) ** duration - 1);
      financing.push({
        id: `demo-loan-${pad(financing.length + 1)}`,
        userId: lot.farmerId,
        lotId: lot.id,
        receiptId: receipt.id,
        requestedAmount: amount,
        interestRate: 8.5,
        duration,
        status,
        monthlyPayment: round(payment),
        totalRepayment: round(payment * duration),
        dueDaysAhead: duration * 30 - int(0, 10),
        daysAgo: int(1, 40),
      });
    }
  });

  // ───── community ─────
  const posters = [...farmers.map((f) => f.user), ...buyers];
  const posts: DemoPost[] = [];
  for (let i = 1; i <= 160; i++) {
    const template = pick(POSTS);
    const author = pick(posters);
    const replyCount = weighted([0, 1, 2, 3, 5], (n) => (n === 0 ? 3 : n === 1 ? 3 : n === 2 ? 2 : 1));
    const likeCount = int(0, 14);
    posts.push({
      id: `demo-post-${pad(i, 3)}`,
      userId: author.id,
      userName: author.name,
      userRole: author.role,
      title: template.title,
      content: template.content,
      category: template.category,
      likeUserIds: sample(posters, likeCount).map((u) => u.id),
      daysAgo: int(0, 60),
      replies: Array.from({ length: replyCount }, (_, r) => {
        const replier = pick(posters);
        return { id: `demo-reply-${pad(i, 3)}-${r + 1}`, userId: replier.id, userName: replier.name, content: pick(REPLIES), hoursAfter: int(1, 72) };
      }),
    });
  }

  // ───── subscriptions (buyers and tourists, one live per person) ─────
  const subscriptions: DemoSubscription[] = [];
  sample([...buyers, ...tourists], 45).forEach((user, i) => {
    const plan = pick(PLANS);
    const status = weighted<DemoSubscription['status']>(['active', 'paused', 'cancelled'], (s) => (s === 'active' ? 6 : s === 'paused' ? 2 : 2));
    const monthsActive = int(1, 10);
    subscriptions.push({
      id: `demo-sub-${pad(i + 1, 3)}`,
      userId: user.id,
      planId: plan.id,
      planName: plan.name,
      status,
      frequency: plan.frequency,
      nextDeliveryDaysAhead: int(1, plan.frequency === 'monthly' ? 30 : plan.frequency === 'biweekly' ? 14 : 7),
      totalSpent: round(plan.price * monthsActive),
      bagsSent: monthsActive * (plan.frequency === 'weekly' ? 4 : plan.frequency === 'biweekly' ? 2 : 1),
      daysAgo: monthsActive * 30,
    });
  });

  // ───── support tickets ─────
  const tickets: DemoTicket[] = [];
  for (let i = 1; i <= 40; i++) {
    const template = pick(TICKETS);
    const author = pick(farmers).user;
    const status = weighted<DemoTicket['status']>(['open', 'in_progress', 'resolved'], (s) => (s === 'open' ? 4 : s === 'in_progress' ? 2 : 4));
    const comments: DemoTicket['comments'] = [];
    if (status !== 'open') {
      comments.push({ id: `demo-tc-${pad(i, 3)}-1`, authorId: 'demo-support', authorName: 'Dyp Support', authorRole: 'admin', body: pick(ADMIN_REPLIES), internal: false, hoursAfter: int(1, 24) });
    }
    if (status === 'resolved') {
      comments.push({ id: `demo-tc-${pad(i, 3)}-2`, authorId: author.id, authorName: author.name, authorRole: 'farmer', body: 'Thank you, it is working now.', internal: false, hoursAfter: int(25, 60) });
    }
    tickets.push({
      id: `demo-ticket-${pad(i, 3)}`,
      userId: author.id,
      subject: template.subject,
      body: template.body,
      status,
      priority: weighted<DemoTicket['priority']>(['low', 'normal', 'high', 'urgent'], (p) => (p === 'normal' ? 6 : p === 'low' ? 3 : p === 'high' ? 2 : 1)),
      team: status === 'open' ? null : template.team,
      daysAgo: int(0, 30),
      comments,
    });
  }

  const data: DemoData = {
    meta: {
      seed: SEED,
      counts: {
        farmers: FARMERS,
        buyers: BUYERS,
        tourists: TOURISTS,
        farms: farms.length,
        lots: lots.length,
        auctions: auctions.length,
        bids: auctions.reduce((n, a) => n + a.bids.length, 0),
        receipts: receipts.length,
        financing: financing.length,
        posts: posts.length,
        subscriptions: subscriptions.length,
        tickets: tickets.length,
      },
    },
    users,
    farms,
    lots,
    auctions,
    receipts,
    financing,
    posts,
    subscriptions,
    tickets,
    notifications,
  };

  const dir = __dirname;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'demo-data.json'), JSON.stringify(data));

  const lines = [
    '# DEMO LOGINS: TEST ACCOUNTS ONLY',
    '#',
    '# These accounts exist only to test the app (marketplace, bids, farm maps, financing).',
    '# They use @demo.dypfarms.test addresses, which cannot receive email.',
    '# Anyone with this file can sign in as these users on any environment where the demo',
    '# data has been seeded. Keep the repository private, and remove the demo data before a',
    '# real launch (point DATABASE_URL at that database first):  npm run demo:remove',
    '#',
    `# Counts: ${Object.entries(data.meta.counts).map(([k, v]) => `${k} ${v}`).join(', ')}`,
    '# Prices are USD per kg, matching the marketplace screens.',
    '#',
    '# email<TAB>password<TAB>role<TAB>name<TAB>district',
  ];
  for (const role of ['farmer', 'roaster', 'tourist']) {
    lines.push('', `## ${role === 'roaster' ? 'buyers (roaster)' : role + 's'}`);
    for (const l of logins.filter((x) => x.role === role)) lines.push([l.email, l.password, l.role, l.name, l.district].join('\t'));
  }
  writeFileSync(join(dir, 'DEMO_LOGINS.txt'), lines.join('\n') + '\n');

  console.log('Wrote demo-data.json and DEMO_LOGINS.txt', data.meta.counts);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
