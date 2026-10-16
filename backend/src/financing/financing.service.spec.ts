import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FinancingStatus } from '@prisma/client';
import { FinancingService, monthlyPayment } from './financing.service';

const receipt = { id: 'r1', userId: 'u1', lotId: 'l1', estimatedValue: 1_000_000 };

function build(overrides: Record<string, unknown> = {}) {
  const prisma = {
    warehouseReceipt: { findUnique: jest.fn().mockResolvedValue(receipt) },
    financingRequest: {
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({ id: 'f1', createdAt: new Date(), approvedAt: null, fundedAt: null, status: 'pending', ...data }),
      ),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      updateMany: jest.fn(),
    },
    ...overrides,
  };
  return { service: new FinancingService(prisma as never), prisma };
}

describe('FinancingService', () => {
  it('computes the standard amortised payment', () => {
    expect(monthlyPayment(1200, 0, 12)).toBe(100);
    // 8.5% a year is 0.70833% a month; standard annuity formula over 6 months.
    expect(monthlyPayment(1_000_000, 8.5, 6)).toBeCloseTo(170_822.9, 0);
  });

  it('only offers up to 80% of the receipt value', () => {
    const { service } = build();
    expect(service.calculateLoanOffer(1_000_000)).toMatchObject({ maxLoan: 800_000, minLoan: 200_000 });
  });

  it('hides receipts that belong to someone else', async () => {
    const { service, prisma } = build();
    prisma.warehouseReceipt.findUnique.mockResolvedValue({ ...receipt, userId: 'other' });
    await expect(service.createFinancingRequest('u1', undefined, 'r1', 500_000)).rejects.toThrow(NotFoundException);
  });

  it('rejects a lot that does not match the receipt', async () => {
    const { service } = build();
    await expect(service.createFinancingRequest('u1', 'other-lot', 'r1', 500_000)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects amounts above 80% or below 20% of the value', async () => {
    const { service } = build();
    await expect(service.createFinancingRequest('u1', undefined, 'r1', 800_001)).rejects.toThrow(/maximum/);
    await expect(service.createFinancingRequest('u1', undefined, 'r1', 199_999)).rejects.toThrow(/minimum/);
  });

  it('takes the lot from the receipt and rounds the amount', async () => {
    const { service, prisma } = build();
    const created = await service.createFinancingRequest('u1', undefined, 'r1', 500_000.4, 6);
    const data = prisma.financingRequest.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ userId: 'u1', lotId: 'l1', receiptId: 'r1', requestedAmount: 500_000, duration: 6 });
    expect(created.loanTerms.totalRepayment).toBeCloseTo(data.monthlyPayment * 6);
    expect(created.status).toBe('pending');
  });

  it('refuses a second open request for the same receipt', async () => {
    const { service, prisma } = build();
    prisma.financingRequest.create.mockRejectedValue({ code: 'P2002' });
    await expect(service.createFinancingRequest('u1', undefined, 'r1', 500_000)).rejects.toThrow(ConflictException);
  });

  it('shows another user a missing request, but lets an admin read it', async () => {
    const { service, prisma } = build();
    const row = {
      id: 'f1', userId: 'u2', lotId: 'l', receiptId: 'r', requestedAmount: 1, interestRate: 8.5, duration: 6,
      status: 'pending', monthlyPayment: 1, totalRepayment: 6, dueDate: new Date(), createdAt: new Date(),
      approvedAt: null, fundedAt: null,
    };
    prisma.financingRequest.findUnique.mockResolvedValue(row);
    await expect(service.getFinancingRequest('f1', { id: 'u1' })).rejects.toThrow(NotFoundException);
    await expect(service.getFinancingRequest('f1', { id: 'a1', role: 'admin' })).resolves.toMatchObject({ id: 'f1' });
  });

  it('only approves pending requests and only funds approved ones', async () => {
    const { service, prisma } = build();
    prisma.financingRequest.updateMany.mockResolvedValue({ count: 0 });
    prisma.financingRequest.findUnique.mockResolvedValue({ status: FinancingStatus.funded });
    await expect(service.approveFinancing('f1')).rejects.toThrow(ForbiddenException);
    prisma.financingRequest.findUnique.mockResolvedValue(null);
    await expect(service.fundLoan('missing')).rejects.toThrow(NotFoundException);
  });
});
