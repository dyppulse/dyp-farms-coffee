import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TicketEntryKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreService } from '../common/data/store.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateCommentDto,
  CreateTicketDto,
  EscalateTicketDto,
  RequestEscalationDto,
  UpdateTicketDto,
} from './dto/tickets.dto';

interface Actor {
  id: string;
  name: string;
  role: string;
}

const teamLabel = (team: string) => team.charAt(0).toUpperCase() + team.slice(1);

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private store: StoreService,
    private notifications: NotificationsService,
  ) {}

  // ───── helpers ─────

  private userSummary(userId: string) {
    const user = this.store.findUserById(userId);
    return user ? { id: user.id, name: user.name, email: user.email } : null;
  }

  private async getTicketOrThrow(id: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  /** Reporters can only see their own tickets; admins see everything. */
  private assertCanView(ticket: { userId: string }, actor: Actor) {
    if (actor.role !== 'admin' && ticket.userId !== actor.id) {
      throw new NotFoundException('Ticket not found');
    }
  }

  private addEntry(
    ticketId: string,
    actor: Actor,
    data: { body: string; kind?: TicketEntryKind; internal?: boolean },
  ) {
    return this.prisma.ticketComment.create({
      data: {
        ticketId,
        authorId: actor.id,
        authorName: actor.name,
        authorRole: actor.role,
        kind: data.kind ?? 'comment',
        body: data.body,
        internal: data.internal ?? false,
      },
    });
  }

  private notifyAdmins(ticketId: string, title: string, body: string) {
    return Promise.all(
      this.store.findUsersByRole('admin').map((admin) =>
        this.notifications.create({
          userId: admin.id,
          type: 'general',
          title,
          body,
          entityType: 'ticket',
          entityId: ticketId,
        }),
      ),
    );
  }

  private notifyReporter(
    ticket: { id: string; userId: string },
    title: string,
    body: string,
  ) {
    return this.notifications.create({
      userId: ticket.userId,
      type: 'general',
      title,
      body,
      entityType: 'ticket',
      entityId: ticket.id,
    });
  }

  // ───── reporter + shared ─────

  create(userId: string, dto: CreateTicketDto) {
    return this.prisma.ticket.create({
      data: { userId, subject: dto.subject, body: dto.body },
    });
  }

  findMine(userId: string) {
    return this.prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { comments: { where: { kind: 'comment', internal: false } } } } },
    });
  }

  /** Ticket + thread. Internal notes are stripped for reporters. */
  async findOne(id: string, actor: Actor) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        comments: {
          where: actor.role === 'admin' ? {} : { internal: false },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    this.assertCanView(ticket, actor);
    return { ...ticket, user: this.userSummary(ticket.userId) };
  }

  async addComment(id: string, actor: Actor, dto: CreateCommentDto) {
    const ticket = await this.getTicketOrThrow(id);
    this.assertCanView(ticket, actor);
    const isStaff = actor.role === 'admin';
    const internal = isStaff && dto.internal === true;

    const comment = await this.addEntry(id, actor, {
      body: dto.body.trim(),
      internal,
    });

    if (isStaff) {
      if (!internal) {
        await this.notifyReporter(
          ticket,
          'New reply on your ticket',
          `${actor.name} replied to "${ticket.subject}".`,
        );
        // A staff reply on a fresh ticket means someone is on it.
        if (ticket.status === 'open') {
          await this.prisma.ticket.update({
            where: { id },
            data: { status: 'in_progress' },
          });
        }
      }
    } else {
      // Reporter replied: reopen if it had been resolved, and tell staff.
      if (ticket.status === 'resolved') {
        await this.prisma.ticket.update({
          where: { id },
          data: { status: 'open' },
        });
        await this.addEntry(id, actor, {
          kind: 'event',
          body: 'Reopened by the reporter',
        });
      }
      await this.notifyAdmins(
        id,
        'Reporter replied on a ticket',
        `${actor.name} commented on "${ticket.subject}".`,
      );
    }
    return comment;
  }

  /** Reporter-side: ask staff to escalate. Staff then pick the team. */
  async requestEscalation(id: string, actor: Actor, dto: RequestEscalationDto) {
    const ticket = await this.getTicketOrThrow(id);
    if (ticket.userId !== actor.id) throw new ForbiddenException();
    if (ticket.status === 'resolved') {
      throw new BadRequestException('This ticket is already resolved');
    }
    if (ticket.escalationRequestedAt) {
      throw new BadRequestException('Escalation was already requested');
    }
    await this.prisma.ticket.update({
      where: { id },
      data: { escalationRequestedAt: new Date() },
    });
    await this.addEntry(id, actor, {
      kind: 'event',
      body: `Requested escalation: ${dto.reason.trim()}`,
    });
    await this.notifyAdmins(
      id,
      'Escalation requested',
      `${actor.name} asked to escalate "${ticket.subject}".`,
    );
    return this.findOne(id, actor);
  }

  // ───── admin / tech-ops ─────

  async findAllForAdmin() {
    const tickets = await this.prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { comments: { where: { kind: 'comment' } } } } },
    });
    return tickets.map((ticket) => ({
      ...ticket,
      user: this.userSummary(ticket.userId),
    }));
  }

  async update(id: string, actor: Actor, dto: UpdateTicketDto) {
    const ticket = await this.getTicketOrThrow(id);
    const data: Prisma.TicketUpdateInput = {};
    const events: string[] = [];

    if (dto.status && dto.status !== ticket.status) {
      data.status = dto.status;
      events.push(
        `Status changed from ${ticket.status.replace('_', ' ')} to ${dto.status.replace('_', ' ')}`,
      );
    }
    if (dto.priority && dto.priority !== ticket.priority) {
      data.priority = dto.priority;
      events.push(`Priority changed from ${ticket.priority} to ${dto.priority}`);
    }
    if (!events.length) return ticket;

    const updated = await this.prisma.ticket.update({ where: { id }, data });
    for (const body of events) {
      await this.addEntry(id, actor, { kind: 'event', body });
    }
    if (dto.status && dto.status !== ticket.status) {
      await this.notifyReporter(
        ticket,
        'Ticket status updated',
        `"${ticket.subject}" is now ${dto.status.replace('_', ' ')}.`,
      );
    }
    return updated;
  }

  async escalate(id: string, actor: Actor, dto: EscalateTicketDto) {
    const ticket = await this.getTicketOrThrow(id);
    if (ticket.status === 'resolved') {
      throw new BadRequestException('Reopen the ticket before escalating it');
    }
    await this.prisma.ticket.update({
      where: { id },
      data: {
        team: dto.team,
        priority: dto.priority ?? ticket.priority,
        status: ticket.status === 'open' ? 'in_progress' : ticket.status,
        escalatedAt: new Date(),
        escalationRequestedAt: null,
      },
    });
    const note = dto.note?.trim();
    await this.addEntry(id, actor, {
      kind: 'event',
      body:
        `Escalated to the ${teamLabel(dto.team)} team` +
        (dto.priority && dto.priority !== ticket.priority
          ? ` (priority: ${dto.priority})`
          : '') +
        (note ? ` — ${note}` : ''),
    });
    await this.notifyReporter(
      ticket,
      'Your ticket was escalated',
      `"${ticket.subject}" is now with the ${teamLabel(dto.team)} team.`,
    );
    return this.findOne(id, actor);
  }
}
