import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FinancingRequest as Row, FinancingStatus } from '@prisma/client';
import { FIRST_PAGE, type Page } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';

export interface FinancingRequest {
  id: string;
  userId: string;
  lotId: string;
  receiptId: string;
  requestedAmount: number;
  interestRate: number;
  duration: number;
  status: FinancingStatus;
  loanTerms: { monthlyPayment: number; totalRepayment: number; dueDate: string };
  createdAt: string;
  approvedAt?: string;
  fundedAt?: string;
}

export const INTEREST_RATE = 8.5;
const MAX_LTV = 0.8;
const MIN_LTV = 0.2;
const DEFAULT_DURATION_MONTHS = 6;

export function monthlyPayment(principal: number, annualRate: number, months: number) {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  const growth = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * growth) / (growth - 1);
}

function toRequest(r: Row): FinancingRequest {
  return {
    id: r.id,
    userId: r.userId,
    lotId: r.lotId,
    receiptId: r.receiptId,
    requestedAmount: r.requestedAmount,
    interestRate: r.interestRate,
    duration: r.duration,
    status: r.status,
    loanTerms: {
      monthlyPayment: r.monthlyPayment,
      totalRepayment: r.totalRepayment,
      dueDate: r.dueDate.toISOString(),
    },
    createdAt: r.createdAt.toISOString(),
    approvedAt: r.approvedAt?.toISOString(),
    fundedAt: r.fundedAt?.toISOString(),
  };
}

@Injectable()
export class FinancingService {
  constructor(private prisma: PrismaService) {}

  calculateLoanOffer(receiptValue: number) {
    return {
      maxLoan: receiptValue * MAX_LTV,
      minLoan: receiptValue * MIN_LTV,
      interestRate: INTEREST_RATE,
      processingFee: receiptValue * 0.02,
    };
  }

  /** The farmer must own the receipt; the amount must fit the offer for its value. */
  async createFinancingRequest(
    userId: string,
    lotId: string | undefined,
    receiptId: string,
    requestedAmount: number,
    duration: number = DEFAULT_DURATION_MONTHS,
  ): Promise<FinancingRequest> {
    const amount = Math.round(requestedAmount);
    const receipt = await this.prisma.warehouseReceipt.findUnique({ where: { id: receiptId } });
    if (!receipt || receipt.userId !== userId) {
      throw new NotFoundException('Receipt not found');
    }
    if (lotId && receipt.lotId !== lotId) {
      throw new BadRequestException('Receipt does not belong to that lot');
    }
    const offer = this.calculateLoanOffer(receipt.estimatedValue);
    if (amount > offer.maxLoan) {
      throw new BadRequestException(
        `Amount is above the maximum loan for this receipt (${Math.floor(offer.maxLoan)})`,
      );
    }
    if (amount < offer.minLoan) {
      throw new BadRequestException(
        `Amount is below the minimum loan for this receipt (${Math.ceil(offer.minLoan)})`,
      );
    }

    const payment = monthlyPayment(amount, INTEREST_RATE, duration);
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + duration);

    try {
      const row = await this.prisma.financingRequest.create({
        data: {
          userId,
          lotId: receipt.lotId,
          receiptId,
          requestedAmount: amount,
          interestRate: INTEREST_RATE,
          duration,
          monthlyPayment: payment,
          totalRepayment: payment * duration,
          dueDate,
        },
      });
      return toRequest(row);
    } catch (error) {
      // Partial unique index: one open request per receipt.
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException('This receipt already has an open financing request');
      }
      throw error;
    }
  }

  async getFinancingRequests(userId: string, page: Page = FIRST_PAGE) {
    const rows = await this.prisma.financingRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      ...page,
    });
    return rows.map(toRequest);
  }

  /** Owners see their own request; admins can see any. */
  async getFinancingRequest(
    requestId: string,
    actor: { id: string; role?: string },
  ): Promise<FinancingRequest> {
    const row = await this.prisma.financingRequest.findUnique({ where: { id: requestId } });
    if (!row || (row.userId !== actor.id && actor.role !== 'admin')) {
      throw new NotFoundException('Request not found');
    }
    return toRequest(row);
  }

  approveFinancing(requestId: string) {
    return this.transition(requestId, FinancingStatus.pending, {
      status: FinancingStatus.approved,
      approvedAt: new Date(),
    });
  }

  rejectFinancing(requestId: string) {
    return this.transition(requestId, FinancingStatus.pending, {
      status: FinancingStatus.rejected,
    });
  }

  /** Marks an approved loan as funded. Disbursing the money is done outside the app for now. */
  fundLoan(requestId: string) {
    return this.transition(requestId, FinancingStatus.approved, {
      status: FinancingStatus.funded,
      fundedAt: new Date(),
    });
  }

  /** Compare-and-set so two admins acting at once cannot both move the same request. */
  private async transition(
    requestId: string,
    from: FinancingStatus,
    data: { status: FinancingStatus; approvedAt?: Date; fundedAt?: Date },
  ): Promise<FinancingRequest> {
    const { count } = await this.prisma.financingRequest.updateMany({
      where: { id: requestId, status: from },
      data,
    });
    if (count === 0) {
      const existing = await this.prisma.financingRequest.findUnique({ where: { id: requestId } });
      if (!existing) throw new NotFoundException('Request not found');
      throw new ForbiddenException(`Request is ${existing.status}, expected ${from}`);
    }
    const row = await this.prisma.financingRequest.findUniqueOrThrow({ where: { id: requestId } });
    return toRequest(row);
  }
}
