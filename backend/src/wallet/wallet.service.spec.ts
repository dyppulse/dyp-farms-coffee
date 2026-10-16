import { BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PaymentsBridgeService } from '../payments-bridge/payments-bridge.service';

type Tx = Record<string, any>;

function makePrisma() {
  const rows: Tx[] = [];
  let seq = 0;
  const matches = (r: Tx, where: Tx) =>
    Object.entries(where).every(([k, v]) => k === 'OR' || r[k] === v);
  const model = {
    create: jest.fn(async ({ data }: { data: Tx }) => {
      const row = {
        id: `tx${++seq}`,
        createdAt: new Date(),
        externalReference: null,
        ...data,
      };
      rows.push(row);
      return row;
    }),
    update: jest.fn(async ({ where, data }: { where: Tx; data: Tx }) =>
      Object.assign(rows.find((r) => r.id === where.id)!, data),
    ),
    updateMany: jest.fn(async ({ where, data }: { where: Tx; data: Tx }) => {
      const hit = rows.filter((r) => matches(r, where));
      hit.forEach((r) => Object.assign(r, data));
      return { count: hit.length };
    }),
    findUnique: jest.fn(
      async ({ where }: { where: Tx }) =>
        rows.find((r) => r.id === where.id) ?? null,
    ),
    findFirst: jest.fn(
      async ({ where }: { where: Tx }) =>
        rows.find((r) => matches(r, where)) ?? null,
    ),
    aggregate: jest.fn(async ({ where }: { where: Tx }) => {
      const sum = rows
        .filter(
          (r) =>
            r.userId === where.userId &&
            (r.status === 'completed' ||
              (r.status === 'pending' && r.type === 'withdrawal')),
        )
        .reduce((s, r) => s + r.amount, 0);
      return { _sum: { amount: sum } };
    }),
  };
  const prisma: any = {
    transaction: model,
    $executeRaw: jest.fn(),
    $transaction: jest.fn(async (fn: (db: any) => unknown) => fn(prisma)),
  };
  return { prisma, rows };
}

describe('WalletService', () => {
  let payments: PaymentsBridgeService;
  let rows: Tx[];
  let svc: WalletService;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    payments = new PaymentsBridgeService();
    const m = makePrisma();
    rows = m.rows;
    svc = new WalletService(m.prisma, payments);
  });

  const topUp = (amount = 5000) =>
    svc.addFunds('u1', {
      amount,
      provider: 'mtn_momo',
      phoneNumber: '256770000000',
    });

  it('creates a pending top-up and does not credit the balance', async () => {
    const { transaction } = await topUp();
    expect(transaction.status).toBe('pending');
    expect(transaction.externalReference).toBeTruthy();
    expect(await svc.getBalance('u1')).toBe(0);
  });

  it('marks the top-up failed when the provider rejects initiation', async () => {
    jest.spyOn(payments, 'collect').mockRejectedValue(new Error('boom'));
    await expect(topUp()).rejects.toThrow(BadRequestException);
    expect(rows[0].status).toBe('failed');
  });

  it('credits on a successful webhook, exactly once', async () => {
    const { transaction } = await topUp();
    const event = {
      method: 'mtn_momo' as const,
      providerReference: transaction.externalReference!,
      merchantReference: transaction.id,
      status: 'successful' as const,
      money: { amount: 5000, currency: 'UGX' },
      occurredAt: new Date(),
    };
    await svc.onPaymentEvent(event);
    await svc.onPaymentEvent(event);
    expect(await svc.getBalance('u1')).toBe(5000);
    expect(rows).toHaveLength(1);
  });

  it('ignores a success event whose amount or reference does not match', async () => {
    const { transaction } = await topUp();
    const base = {
      method: 'mtn_momo' as const,
      merchantReference: transaction.id,
      status: 'successful' as const,
      occurredAt: new Date(),
    };
    await svc.onPaymentEvent({
      ...base,
      providerReference: transaction.externalReference!,
      money: { amount: 1, currency: 'UGX' },
    });
    await svc.onPaymentEvent({
      ...base,
      providerReference: 'other',
      money: { amount: 5000, currency: 'UGX' },
    });
    expect(await svc.getBalance('u1')).toBe(0);
  });

  it('does not let a late failure undo a completed top-up', async () => {
    const { transaction } = await topUp();
    const ev = (status: 'successful' | 'failed') => ({
      method: 'mtn_momo' as const,
      providerReference: transaction.externalReference!,
      merchantReference: transaction.id,
      status,
      money: { amount: 5000, currency: 'UGX' },
      occurredAt: new Date(),
    });
    await svc.onPaymentEvent(ev('successful'));
    await svc.onPaymentEvent(ev('failed'));
    expect(await svc.getBalance('u1')).toBe(5000);
  });

  it('poll settles via the provider and refuses other users', async () => {
    const { transaction } = await topUp();
    jest.spyOn(payments, 'verify').mockResolvedValue({
      providerReference: transaction.externalReference!,
      status: 'successful',
    });
    const res = await svc.pollTopUp(transaction.id, 'u1');
    expect(res.transaction!.status).toBe('completed');
    expect(res.balance).toBe(5000);
    await expect(svc.pollTopUp(transaction.id, 'u2')).rejects.toThrow(
      'not found',
    );
  });

  it('withdrawal holds funds under a lock and rejects overdrafts', async () => {
    rows.push({
      id: 'seed',
      userId: 'u1',
      type: 'deposit',
      status: 'completed',
      amount: 10000,
    });
    const w = { provider: 'mtn_momo' as const, phoneNumber: '256770000000' };
    const res = await svc.withdraw('u1', { amount: 7000, ...w });
    expect(res.transaction.status).toBe('pending');
    expect(res.balance).toBe(3000);
    await expect(svc.withdraw('u1', { amount: 7000, ...w })).rejects.toThrow(
      'Insufficient balance',
    );
  });

  it('reject releases the hold; approve completes; both are one-shot', async () => {
    rows.push({
      id: 'seed',
      userId: 'u1',
      type: 'deposit',
      status: 'completed',
      amount: 10000,
    });
    const w = { provider: 'mtn_momo' as const, phoneNumber: '256770000000' };
    const a = (await svc.withdraw('u1', { amount: 4000, ...w })).transaction;
    await svc.rejectWithdrawal(a.id, 'bad number');
    expect(await svc.getBalance('u1')).toBe(10000);
    await expect(svc.approveWithdrawal(a.id)).rejects.toThrow(
      'no longer pending',
    );

    const b = (await svc.withdraw('u1', { amount: 4000, ...w })).transaction;
    const done = await svc.approveWithdrawal(b.id, 'MM123');
    expect(done!.status).toBe('completed');
    expect(await svc.getBalance('u1')).toBe(6000);
  });
});
