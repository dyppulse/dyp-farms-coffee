import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DEMO_EMAIL_DOMAIN, DEMO_ID_PREFIX, DemoData } from './demo-data.types';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function loadDemoData(): DemoData {
  const file = join(process.cwd(), 'prisma', 'demo', 'demo-data.json');
  return JSON.parse(readFileSync(file, 'utf8')) as DemoData;
}

function chunks<T>(items: T[], size = 500): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function insert<T>(rows: T[], write: (batch: T[]) => Promise<{ count: number }>) {
  let inserted = 0;
  for (const batch of chunks(rows)) inserted += (await write(batch)).count;
  return inserted;
}

export type DemoSeedResult = Record<string, number>;

/**
 * Inserts the demo dataset. Safe to run again: rows are matched by their fixed ids and
 * skipped when present, and nothing outside the demo ids is touched. Evergreen auctions
 * that are about to close are pushed forward so there are always bids to test.
 */
export async function seedDemoData(
  prisma: PrismaClient,
  data: DemoData,
  now: Date = new Date(),
): Promise<DemoSeedResult> {
  const ago = (ms: number) => new Date(now.getTime() - ms);
  const ahead = (ms: number) => new Date(now.getTime() + ms);
  const result: DemoSeedResult = {};

  result.users = await insert(data.users, (batch) =>
    prisma.user.createMany({
      data: batch.map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, passwordHash: u.passwordHash })),
      skipDuplicates: true,
    }),
  );

  result.farms = await insert(data.farms, (batch) =>
    prisma.farm.createMany({
      data: batch.map((f) => ({
        id: f.id,
        ownerId: f.ownerId,
        name: f.name,
        sizeHectares: f.sizeHectares,
        boundary: f.boundary,
        createdAt: ago(f.daysAgo * DAY),
      })),
      skipDuplicates: true,
    }),
  );

  result.lots = await insert(data.lots, (batch) =>
    prisma.coffeeLot.createMany({
      data: batch.map((l) => ({
        id: l.id,
        name: l.name,
        origin: l.origin,
        grade: l.grade,
        price: l.price,
        cuppingNotes: l.cuppingNotes,
        traceability: l.traceability,
        warehouse: l.warehouse,
        quantity: l.quantity,
        unit: l.unit,
        inAuction: l.inAuction,
        farmerId: l.farmerId,
        farmId: l.farmId,
        createdAt: ago(l.daysAgo * DAY),
      })),
      skipDuplicates: true,
    }),
  );

  result.auctions = await insert(data.auctions, (batch) =>
    prisma.auction.createMany({
      data: batch.map((a) => ({
        id: a.id,
        lotId: a.lotId,
        currentBid: a.currentBid,
        status: a.status,
        endsAt: a.status === 'active' ? ahead(a.hoursLeft * HOUR) : ago(a.endedDaysAgo * DAY),
        createdAt: ago((a.status === 'active' ? 4 : a.endedDaysAgo + 5) * DAY),
      })),
      skipDuplicates: true,
    }),
  );

  result.bids = await insert(
    data.auctions.flatMap((a) => a.bids.map((b) => ({ ...b, auctionId: a.id }))),
    (batch) =>
      prisma.bid.createMany({
        data: batch.map((b) => ({
          id: b.id,
          auctionId: b.auctionId,
          userId: b.userId,
          bidderName: b.bidderName,
          amount: b.amount,
          createdAt: ago(b.minutesAgo * MINUTE),
        })),
        skipDuplicates: true,
      }),
  );

  result.autoBids = await insert(
    data.auctions.flatMap((a) => a.autoBids.map((b) => ({ ...b, auctionId: a.id }))),
    (batch) => prisma.autoBidLimit.createMany({ data: batch, skipDuplicates: true }),
  );

  result.receipts = await insert(data.receipts, (batch) =>
    prisma.warehouseReceipt.createMany({
      data: batch.map((r) => ({ ...r, createdAt: ago(r.daysAgo * DAY), daysAgo: undefined })),
      skipDuplicates: true,
    }),
  );

  result.financing = await insert(data.financing, (batch) =>
    prisma.financingRequest.createMany({
      data: batch.map((f) => ({
        id: f.id,
        userId: f.userId,
        lotId: f.lotId,
        receiptId: f.receiptId,
        requestedAmount: f.requestedAmount,
        interestRate: f.interestRate,
        duration: f.duration,
        status: f.status,
        monthlyPayment: f.monthlyPayment,
        totalRepayment: f.totalRepayment,
        dueDate: ahead(f.dueDaysAhead * DAY),
        createdAt: ago(f.daysAgo * DAY),
        approvedAt: f.status === 'approved' || f.status === 'funded' ? ago(Math.max(0, f.daysAgo - 1) * DAY) : null,
        fundedAt: f.status === 'funded' ? ago(Math.max(0, f.daysAgo - 2) * DAY) : null,
      })),
      skipDuplicates: true,
    }),
  );

  result.posts = await insert(data.posts, (batch) =>
    prisma.communityPost.createMany({
      data: batch.map((p) => ({
        id: p.id,
        userId: p.userId,
        userName: p.userName,
        userRole: p.userRole,
        title: p.title,
        content: p.content,
        category: p.category,
        likeCount: p.likeUserIds.length,
        createdAt: ago(p.daysAgo * DAY),
      })),
      skipDuplicates: true,
    }),
  );
  result.replies = await insert(
    data.posts.flatMap((p) => p.replies.map((r) => ({ ...r, postId: p.id, postDaysAgo: p.daysAgo }))),
    (batch) =>
      prisma.communityReply.createMany({
        data: batch.map((r) => ({
          id: r.id,
          postId: r.postId,
          userId: r.userId,
          userName: r.userName,
          content: r.content,
          createdAt: new Date(Math.min(now.getTime(), ago(r.postDaysAgo * DAY).getTime() + r.hoursAfter * HOUR)),
        })),
        skipDuplicates: true,
      }),
  );
  result.likes = await insert(
    data.posts.flatMap((p) => p.likeUserIds.map((userId) => ({ postId: p.id, userId }))),
    (batch) => prisma.communityPostLike.createMany({ data: batch, skipDuplicates: true }),
  );

  // One live subscription per person is enforced by the database; cancelled ones are fine.
  result.subscriptions = await insert(data.subscriptions, (batch) =>
    prisma.subscription.createMany({
      data: batch.map((s) => ({
        id: s.id,
        userId: s.userId,
        planId: s.planId,
        planName: s.planName,
        status: s.status,
        frequency: s.frequency,
        nextDeliveryAt: ahead(s.nextDeliveryDaysAhead * DAY),
        nextPaymentAt: ahead(s.nextDeliveryDaysAhead * DAY),
        totalSpent: s.totalSpent,
        bagsSent: s.bagsSent,
        createdAt: ago(s.daysAgo * DAY),
      })),
      skipDuplicates: true,
    }),
  );

  result.tickets = await insert(data.tickets, (batch) =>
    prisma.ticket.createMany({
      data: batch.map((t) => ({
        id: t.id,
        userId: t.userId,
        subject: t.subject,
        body: t.body,
        status: t.status,
        priority: t.priority,
        team: t.team,
        createdAt: ago(t.daysAgo * DAY),
      })),
      skipDuplicates: true,
    }),
  );
  result.ticketComments = await insert(
    data.tickets.flatMap((t) => t.comments.map((c) => ({ ...c, ticketId: t.id, ticketDaysAgo: t.daysAgo }))),
    (batch) =>
      prisma.ticketComment.createMany({
        data: batch.map((c) => ({
          id: c.id,
          ticketId: c.ticketId,
          authorId: c.authorId,
          authorName: c.authorName,
          authorRole: c.authorRole,
          body: c.body,
          internal: c.internal,
          createdAt: new Date(Math.min(now.getTime(), ago(c.ticketDaysAgo * DAY).getTime() + c.hoursAfter * HOUR)),
        })),
        skipDuplicates: true,
      }),
  );

  result.notifications = await insert(data.notifications, (batch) =>
    prisma.notification.createMany({
      data: batch.map((n) => ({
        id: n.id,
        userId: n.userId,
        type: 'bid' as const,
        title: n.title,
        body: n.body,
        entityType: n.entityType,
        entityId: n.entityId,
        read: n.read,
        createdAt: ago(n.minutesAgo * MINUTE),
      })),
      skipDuplicates: true,
    }),
  );

  result.auctionsExtended = await keepEvergreenAuctionsOpen(prisma, data, now);
  return result;
}

/** Evergreen demo auctions that are closing within two hours get a fresh window. */
export async function keepEvergreenAuctionsOpen(prisma: PrismaClient, data: DemoData, now: Date = new Date()) {
  const hoursById = new Map(data.auctions.filter((a) => a.evergreen).map((a) => [a.id, a.hoursLeft]));
  const closing = await prisma.auction.findMany({
    where: {
      id: { in: [...hoursById.keys()] },
      status: 'active',
      endsAt: { lt: new Date(now.getTime() + 2 * HOUR) },
    },
    select: { id: true },
  });
  for (const { id } of closing) {
    await prisma.auction.update({
      where: { id },
      data: { endsAt: new Date(now.getTime() + Math.max(24, hoursById.get(id) ?? 24) * HOUR) },
    });
  }
  return closing.length;
}

/** Deletes everything the demo seed created, and nothing else. */
export async function removeDemoData(prisma: PrismaClient): Promise<DemoSeedResult> {
  const idPrefix = { startsWith: DEMO_ID_PREFIX };
  const demoUsers = { endsWith: `@${DEMO_EMAIL_DOMAIN}` };
  const result: DemoSeedResult = {};
  const count = (r: { count: number }) => r.count;

  result.tickets = count(await prisma.ticket.deleteMany({ where: { id: idPrefix } })); // cascades comments
  result.posts = count(await prisma.communityPost.deleteMany({ where: { id: idPrefix } })); // cascades replies, likes
  result.subscriptions = count(await prisma.subscription.deleteMany({ where: { id: idPrefix } }));
  result.financing = count(await prisma.financingRequest.deleteMany({ where: { id: idPrefix } }));
  result.notifications = count(await prisma.notification.deleteMany({ where: { id: idPrefix } }));
  result.receipts = count(await prisma.warehouseReceipt.deleteMany({ where: { id: idPrefix } }));
  result.lots = count(await prisma.coffeeLot.deleteMany({ where: { id: idPrefix } })); // cascades auctions, bids, auto-bids
  result.farms = count(await prisma.farm.deleteMany({ where: { id: idPrefix } }));
  result.users = count(await prisma.user.deleteMany({ where: { email: demoUsers } }));
  return result;
}
