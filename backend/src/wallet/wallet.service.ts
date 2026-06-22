import { BadRequestException, Injectable } from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string): Promise<number> {
    const result = await this.prisma.transaction.aggregate({
      where: { userId, status: TransactionStatus.completed },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  getTransactions(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { booking: { include: { tour: true, slot: true } } },
    });
  }

  async addFunds(userId: string, amount: number) {
    const tx = await this.prisma.transaction.create({
      data: {
        userId,
        type: 'deposit',
        provider: 'wallet',
        amount,
        currency: 'UGX',
        status: TransactionStatus.completed,
        description: 'Add Funds',
      },
    });
    return { balance: await this.getBalance(userId), transaction: tx };
  }

  async withdraw(userId: string, amount: number) {
    const balance = await this.getBalance(userId);
    if (balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }
    const tx = await this.prisma.transaction.create({
      data: {
        userId,
        type: 'withdrawal',
        provider: 'wallet',
        amount: -amount,
        currency: 'UGX',
        status: TransactionStatus.completed,
        description: 'Withdraw to Bank',
      },
    });
    return { balance: await this.getBalance(userId), transaction: tx };
  }
}
