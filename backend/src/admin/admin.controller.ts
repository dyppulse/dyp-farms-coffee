import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { StoreService } from '../common/data/store.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin/stats')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminStatsController {
  constructor(
    private store: StoreService,
    private prisma: PrismaService,
  ) {}

  @Get()
  async getStats() {
    const lots = this.store.getLots();
    const auctions = this.store.getAuctions();
    const [farmCount, openTickets] = await Promise.all([
      this.prisma.farm.count(),
      this.prisma.ticket.count({ where: { status: { not: 'resolved' } } }),
    ]);

    return {
      totalLots: lots.length,
      totalVolumeKg: lots.reduce(
        (sum, lot) => sum + (lot.unit === 'kg' ? lot.quantity : 0),
        0,
      ),
      activeAuctions: auctions.filter((a) => a.status === 'active').length,
      totalFarms: farmCount,
      openTickets,
    };
  }
}
