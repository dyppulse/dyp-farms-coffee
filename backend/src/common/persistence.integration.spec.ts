import { PrismaClient } from '@prisma/client';
import { AccountService } from '../account/account.service';
import { hashPasswordSync } from '../auth/password';
import { CommunityService } from '../community/community.service';
import { FinancingService } from '../financing/financing.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

// Needs a migrated Postgres: TEST_DATABASE_URL=postgresql://… npx jest persistence
const url = process.env.TEST_DATABASE_URL;
const describeDb = url ? describe : describe.skip;

describeDb('community, financing and subscriptions (Postgres)', () => {
  let prisma: PrismaClient;
  let community: CommunityService;
  let financing: FinancingService;
  let subs: SubscriptionsService;
  let userId: string;
  let lotId: string;
  const stamp = Date.now();
  const email = `persist-${stamp}@example.com`;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url } } });
    const svc = prisma as unknown as PrismaService;
    community = new CommunityService(svc);
    financing = new FinancingService(svc);
    subs = new SubscriptionsService(svc);
    const user = await prisma.user.create({
      data: { email, name: 'Persist', role: 'farmer', passwordHash: hashPasswordSync('longenough1') },
    });
    userId = user.id;
    const lot = await prisma.coffeeLot.create({
      data: {
        name: `Lot ${stamp}`, origin: 'Mt Elgon', grade: 'AA', price: 100, cuppingNotes: 'x', traceability: 'x',
        warehouse: 'W', quantity: 100, unit: 'kg', farmerId: userId,
      } as never,
    });
    lotId = lot.id;
  });

  afterAll(async () => {
    await prisma.financingRequest.deleteMany({ where: { userId } });
    await prisma.coffeeLot.deleteMany({ where: { id: lotId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('community posts, replies, likes and private chats are stored', async () => {
    const post = await community.createPost({ id: userId, name: 'Persist', role: 'farmer' }, 'Drying tips', 'Dry slowly', 'tips');
    await community.addReply(post.id, userId, 'Persist', 'Thanks');
    expect(await community.toggleLike(post.id, userId)).toMatchObject({ liked: true, likes: 1 });
    expect(await community.toggleLike(post.id, userId)).toMatchObject({ liked: false, likes: 0 });
    const listed = (await community.getPosts('tips')).find((p) => p.id === post.id);
    expect(listed?.replies).toBe(1);

    const conversationId = await community.startChatConversation(userId);
    await community.sendChatMessage(conversationId, userId, 'Persist', 'help with financing');
    const history = await community.getChatHistory(conversationId, userId);
    expect(history.map((m) => m.isAgent)).toEqual([true, false, true]);
    await expect(community.getChatHistory(conversationId, 'someone-else')).rejects.toMatchObject({ status: 403 });
  });

  it('one live subscription per user, enforced by the database', async () => {
    const first = await subs.createSubscription(userId, 'plan-starter');
    await expect(subs.createSubscription(userId, 'plan-enthusiast')).rejects.toMatchObject({ status: 409 });
    await subs.pauseSubscription(userId, first.id);
    await expect(subs.createSubscription(userId, 'plan-enthusiast')).rejects.toMatchObject({ status: 409 });
    await subs.cancelSubscription(userId, first.id);
    const second = await subs.createSubscription(userId, 'plan-enthusiast');
    expect(second.planName).toBe('Enthusiast');
    expect(await subs.getUserSubscription(userId)).toMatchObject({ id: second.id });
  });

  it('financing: one open request per receipt, admin transitions', async () => {
    const receipt = await prisma.warehouseReceipt.create({
      data: {
        userId, lotId, lotName: 'L', variety: 'SL28', quantity: 10, unit: 'kg', grade: 'AA',
        moistureLevel: 11, storageLocation: 'W', qualityScore: 90, estimatedValue: 1_000_000,
      },
    });
    const loan = await financing.createFinancingRequest(userId, undefined, receipt.id, 500_000, 6);
    expect(loan.status).toBe('pending');
    await expect(financing.createFinancingRequest(userId, undefined, receipt.id, 500_000)).rejects.toMatchObject({
      status: 409,
    });
    await expect(financing.fundLoan(loan.id)).rejects.toMatchObject({ status: 403 }); // not approved yet
    expect((await financing.approveFinancing(loan.id)).status).toBe('approved');
    expect((await financing.fundLoan(loan.id)).status).toBe('funded');
    // A rejected request frees the receipt for a new one.
    const receipt2 = await prisma.warehouseReceipt.create({
      data: {
        userId, lotId, lotName: 'L', variety: 'SL28', quantity: 10, unit: 'kg', grade: 'AA',
        moistureLevel: 11, storageLocation: 'W', qualityScore: 90, estimatedValue: 1_000_000,
      },
    });
    const a = await financing.createFinancingRequest(userId, undefined, receipt2.id, 300_000);
    await financing.rejectFinancing(a.id);
    await expect(financing.createFinancingRequest(userId, undefined, receipt2.id, 300_000)).resolves.toBeDefined();
  });

  it('account deletion removes community content and subscriptions but keeps loans', async () => {
    const account = new AccountService(prisma as unknown as PrismaService);
    await account.deleteAccount(userId, 'longenough1');
    expect(await prisma.communityPost.count({ where: { userId } })).toBe(0);
    expect(await prisma.chatConversation.count({ where: { userId } })).toBe(0);
    expect(await prisma.subscription.count({ where: { userId } })).toBe(0);
    expect(await prisma.financingRequest.count({ where: { userId } })).toBeGreaterThan(0);
  });
});
