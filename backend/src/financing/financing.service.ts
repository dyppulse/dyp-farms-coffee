import { Injectable } from '@nestjs/common';
import { StoreService } from '../common/data/store.service';

export interface FinancingRequest {
  id: string;
  userId: string;
  lotId: string;
  receiptId: string;
  requestedAmount: number;
  interestRate: number;
  duration: number;
  status: 'pending' | 'approved' | 'rejected' | 'funded' | 'repaid';
  loanTerms?: {
    monthlyPayment: number;
    totalRepayment: number;
    dueDate: string;
  };
  createdAt: string;
  approvedAt?: string;
  fundedAt?: string;
}

@Injectable()
export class FinancingService {
  constructor(private store: StoreService) {}

  calculateLoanOffer(receiptValue: number): {
    maxLoan: number;
    minLoan: number;
    interestRate: number;
    processingFee: number;
  } {
    const maxLoan = receiptValue * 0.8;
    const minLoan = receiptValue * 0.2;
    const interestRate = 8.5;
    const processingFee = receiptValue * 0.02;

    return {
      maxLoan,
      minLoan,
      interestRate,
      processingFee,
    };
  }

  createFinancingRequest(
    userId: string,
    lotId: string,
    receiptId: string,
    amount: number,
    duration: number = 6,
  ): FinancingRequest {
    const interestRate = 8.5;
    const monthlyPayment = this.calculateMonthlyPayment(
      amount,
      interestRate,
      duration,
    );
    const totalRepayment = monthlyPayment * duration;
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + duration);

    return {
      id: `loan-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      userId,
      lotId,
      receiptId,
      requestedAmount: amount,
      interestRate,
      duration,
      status: 'pending',
      loanTerms: {
        monthlyPayment,
        totalRepayment,
        dueDate: dueDate.toISOString(),
      },
      createdAt: new Date().toISOString(),
    };
  }

  private calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    months: number,
  ): number {
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) return principal / months;
    return (
      (principal *
        (monthlyRate * Math.pow(1 + monthlyRate, months))) /
      (Math.pow(1 + monthlyRate, months) - 1)
    );
  }

  getFinancingRequests(userId: string): FinancingRequest[] {
    return [];
  }

  approveFinancing(requestId: string): FinancingRequest {
    const requests: FinancingRequest[] = [];
    const request = requests.find((r: FinancingRequest) => r.id === requestId);

    if (!request) throw new Error('Request not found');

    return request;
  }

  fundLoan(requestId: string): FinancingRequest {
    const requests: FinancingRequest[] = [];
    const request = requests.find((r: FinancingRequest) => r.id === requestId);

    if (!request) throw new Error('Request not found');

    return request;
  }
}
