import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ToursService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.tour.findMany({ orderBy: { title: 'asc' } });
  }

  async findById(id: string) {
    const tour = await this.prisma.tour.findUnique({ where: { id } });
    if (!tour) throw new NotFoundException('Tour not found');
    return tour;
  }

  getReviews(tourId?: string) {
    return this.prisma.review.findMany({
      where: tourId ? { tourId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSlots(tourId: string, from?: string, to?: string) {
    await this.findById(tourId);
    const fromDate = from ? new Date(from) : new Date();
    const toDate = to
      ? new Date(to)
      : new Date(fromDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    return this.prisma.tourSlot.findMany({
      where: {
        tourId,
        status: 'open',
        date: { gte: fromDate, lte: toDate },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }
}
