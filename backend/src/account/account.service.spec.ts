import { PrismaClient } from '@prisma/client';
import { hashPasswordSync } from '../auth/password';
import { PrismaService } from '../prisma/prisma.service';
import { AccountService } from './account.service';

// Needs a migrated Postgres: TEST_DATABASE_URL=postgresql://… npx jest account
const url = process.env.TEST_DATABASE_URL;
const describeDb = url ? describe : describe.skip;

describeDb('AccountService (Postgres)', () => {
  let prisma: PrismaClient;
  let service: AccountService;
  const email = `del-${Date.now()}@example.com`;
  let userId: string;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url } } });
    service = new AccountService(prisma as unknown as PrismaService);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email } });
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Del',
        role: 'farmer',
        passwordHash: hashPasswordSync('longenough1'),
      },
    });
    userId = user.id;
  });

  it('rejects a wrong password and deletes nothing', async () => {
    await expect(service.deleteAccount(userId, 'nope')).rejects.toMatchObject({
      status: 401,
    });
    expect(await prisma.user.findUnique({ where: { id: userId } })).not.toBeNull();
  });

  it('refuses admins', async () => {
    await prisma.user.update({ where: { id: userId }, data: { role: 'admin' } });
    await expect(
      service.deleteAccount(userId, 'longenough1'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('removes personal rows and keeps redacted financial rows', async () => {
    await prisma.farm.create({
      data: { ownerId: userId, name: 'F', boundary: [] },
    });
    await prisma.notification.create({
      data: { userId, type: 'general', title: 't', body: 'b' },
    });
    await prisma.ticket.create({
      data: { userId, subject: 's', body: 'b' },
    });
    const tx = await prisma.transaction.create({
      data: {
        userId,
        type: 'deposit',
        provider: 'wallet',
        amount: 1000,
        description: 'Add Funds',
      },
    });
    const order = await prisma.shopOrder.create({
      data: {
        userId,
        channel: 'direct',
        subtotal: 1,
        totalAmount: 1,
        deliveryMethod: 'shipping',
        deliveryAddress: '1 Secret St',
        paymentMethod: 'mtn_momo',
        paymentPhone: '256700000000',
        expiresAt: new Date(),
      },
    });

    await expect(service.deleteAccount(userId, 'longenough1')).resolves.toEqual({
      deleted: true,
    });

    expect(await prisma.user.findUnique({ where: { id: userId } })).toBeNull();
    expect(await prisma.farm.count({ where: { ownerId: userId } })).toBe(0);
    expect(await prisma.notification.count({ where: { userId } })).toBe(0);
    expect(await prisma.ticket.count({ where: { userId } })).toBe(0);
    expect(await prisma.transaction.findUnique({ where: { id: tx.id } })).not.toBeNull();
    const kept = await prisma.shopOrder.findUnique({ where: { id: order.id } });
    expect(kept?.paymentPhone).toBe('deleted');
    expect(kept?.deliveryAddress).toBeNull();
    await prisma.shopOrder.delete({ where: { id: order.id } });
    await prisma.transaction.delete({ where: { id: tx.id } });
  });
});
