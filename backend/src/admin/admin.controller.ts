import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin/stats')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminStatsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getStats() {
    // Counted in the database: the list endpoints are capped, so they cannot be summed here.
    const [totalLots, volume, activeAuctions, farmCount, openTickets] = await Promise.all([
      this.prisma.coffeeLot.count(),
      this.prisma.coffeeLot.aggregate({ where: { unit: 'kg' }, _sum: { quantity: true } }),
      this.prisma.auction.count({ where: { status: 'active' } }),
      this.prisma.farm.count(),
      this.prisma.ticket.count({ where: { status: { not: 'resolved' } } }),
    ]);

    return {
      totalLots,
      totalVolumeKg: volume._sum.quantity ?? 0,
      activeAuctions,
      totalFarms: farmCount,
      openTickets,
    };
  }
}
