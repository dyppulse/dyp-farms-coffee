import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StoreService } from '../common/data/store.service';
import { CreateTicketDto, UpdateTicketStatusDto } from './dto/tickets.dto';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private store: StoreService,
  ) {}

  create(userId: string, dto: CreateTicketDto) {
    return this.prisma.ticket.create({
      data: { userId, subject: dto.subject, body: dto.body },
    });
  }

  findMine(userId: string) {
    return this.prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllForAdmin() {
    const tickets = await this.prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return tickets.map((ticket) => {
      const user = this.store.findUserById(ticket.userId);
      return {
        ...ticket,
        user: user ? { id: user.id, name: user.name, email: user.email } : null,
      };
    });
  }

  async updateStatus(id: string, dto: UpdateTicketStatusDto) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.prisma.ticket.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
