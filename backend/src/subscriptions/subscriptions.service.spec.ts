import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { addInterval, SubscriptionsService } from './subscriptions.service';

const base = {
  id: 's1', userId: 'u1', planId: 'plan-starter', planName: 'Starter', status: 'active', frequency: 'monthly',
  nextDeliveryAt: new Date('2026-11-01T00:00:00Z'), nextPaymentAt: new Date('2026-11-01T00:00:00Z'),
  totalSpent: 0, bagsSent: 0, createdAt: new Date('2026-10-01T00:00:00Z'),
};

function build(row: Record<string, unknown> | null = base) {
  const prisma = {
    subscription: {
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...base, ...data })),
      findUnique: jest.fn().mockResolvedValue(row),
      findFirst: jest.fn().mockResolvedValue(row),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...base, ...(row ?? {}), ...data })),
    },
  };
  return { service: new SubscriptionsService(prisma as never), prisma };
}

describe('SubscriptionsService', () => {
  it('adds the right interval for each frequency', () => {
    const d = new Date('2026-01-10T00:00:00Z');
    expect(addInterval(d, 'weekly').toISOString()).toBe('2026-01-17T00:00:00.000Z');
    expect(addInterval(d, 'biweekly').toISOString()).toBe('2026-01-24T00:00:00.000Z');
    expect(addInterval(d, 'monthly').toISOString()).toBe('2026-02-10T00:00:00.000Z');
  });

  it('creates from a known plan and rejects unknown plans', async () => {
    const { service, prisma } = build();
    const sub = await service.createSubscription('u1', 'plan-enthusiast');
    expect(prisma.subscription.create.mock.calls[0][0].data).toMatchObject({ userId: 'u1', frequency: 'biweekly' });
    expect(sub.deliveryFrequency).toBe('biweekly');
    await expect(service.createSubscription('u1', 'nope')).rejects.toThrow(NotFoundException);
  });

  it('turns the database uniqueness error into a clear conflict', async () => {
    const { service, prisma } = build();
    prisma.subscription.create.mockRejectedValue({ code: 'P2002' });
    await expect(service.createSubscription('u1', 'plan-starter')).rejects.toThrow(ConflictException);
  });

  it("treats someone else's subscription as missing", async () => {
    const { service } = build({ ...base, userId: 'someone-else' });
    await expect(service.pauseSubscription('u1', 's1')).rejects.toThrow(NotFoundException);
    await expect(service.cancelSubscription('u1', 's1')).rejects.toThrow(NotFoundException);
  });

  it('follows the pause, resume and cancel rules', async () => {
    const active = build({ ...base, status: SubscriptionStatus.active });
    await expect(active.service.resumeSubscription('u1', 's1')).rejects.toThrow(BadRequestException);
    await expect(active.service.pauseSubscription('u1', 's1')).resolves.toMatchObject({ status: 'paused' });

    const paused = build({ ...base, status: SubscriptionStatus.paused });
    await expect(paused.service.pauseSubscription('u1', 's1')).rejects.toThrow(BadRequestException);
    await expect(paused.service.skipDelivery('u1', 's1')).rejects.toThrow(BadRequestException);
    await expect(paused.service.resumeSubscription('u1', 's1')).resolves.toMatchObject({ status: 'active' });

    const cancelled = build({ ...base, status: SubscriptionStatus.cancelled });
    await expect(cancelled.service.updateDeliveryFrequency('u1', 's1', 'weekly')).rejects.toThrow(BadRequestException);
  });

  it('skipping moves the next delivery by one interval', async () => {
    const { service } = build();
    const sub = await service.skipDelivery('u1', 's1');
    expect(sub.nextDeliveryDate).toBe('2026-12-01T00:00:00.000Z');
  });
});
