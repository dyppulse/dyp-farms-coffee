import { FIRST_PAGE, type Page } from '../pagination';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { planAutoBids } from './auction-engine';
import { shipments } from './seed.data';
import {
  Auction,
  AuctionBid,
  CartItem,
  CoffeeLot,
  Shipment,
  User,
} from '../interfaces';

type DbUser = Prisma.UserGetPayload<object>;
type DbLot = Prisma.CoffeeLotGetPayload<object>;
type DbBid = Prisma.BidGetPayload<object>;
type DbAuction = Prisma.AuctionGetPayload<{ include: { bids: true } }>;

const toUser = (u: DbUser): User => ({
  id: u.id,
  email: u.email,
  password: u.passwordHash,
  name: u.name,
  role: u.role,
  createdAt: u.createdAt.toISOString(),
});

const toLot = (l: DbLot): CoffeeLot => ({
  id: l.id,
  lotNumber: String(l.lotNumber),
  name: l.name,
  origin: l.origin,
  grade: l.grade,
  price: l.price,
  cuppingNotes: l.cuppingNotes,
  traceability: l.traceability,
  warehouse: l.warehouse,
  quantity: l.quantity,
  unit: l.unit,
  imageUrl: l.imageUrl ?? undefined,
  inAuction: l.inAuction,
  farmerId: l.farmerId ?? undefined,
  farmId: l.farmId ?? undefined,
});

const toBid = (b: DbBid, lotId: string): AuctionBid => ({
  id: b.id,
  lotId,
  userId: b.userId,
  bidderName: b.bidderName,
  amount: b.amount,
  createdAt: b.createdAt.toISOString(),
});

const toAuction = (a: DbAuction): Auction => ({
  id: a.id,
  lotId: a.lotId,
  currentBid: a.currentBid,
  endsAt: a.endsAt.toISOString(),
  status: a.status,
  bids: [...a.bids]
    .sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime())
    .map((b) => toBid(b, a.lotId)),
});

/**
 * Prisma-backed accounts / lots / auctions / cart. Shipments (logistics) are
 * still static demo data and not persisted.
 */
@Injectable()
export class StoreService {
  private shipments = [...shipments];

  constructor(private prisma: PrismaService) {}

  // ───── users ─────

  async findUserByEmail(email: string): Promise<User | undefined> {
    const u = await this.prisma.user.findUnique({ where: { email } });
    return u ? toUser(u) : undefined;
  }

  async findUserById(id: string): Promise<User | undefined> {
    const u = await this.prisma.user.findUnique({ where: { id } });
    return u ? toUser(u) : undefined;
  }

  async findUsersByRole(role: User['role']): Promise<User[]> {
    return (await this.prisma.user.findMany({ where: { role } })).map(toUser);
  }

  /** `password` must already be hashed. Throws P2002 if the email exists. */
  async createUser(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const u = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.password,
        name: data.name,
        role: data.role,
      },
    });
    return toUser(u);
  }

  // ───── lots ─────

  async getLots(search?: string, page: Page = FIRST_PAGE): Promise<CoffeeLot[]> {
    const q = search?.trim();
    const lots = await this.prisma.coffeeLot.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { origin: { contains: q, mode: 'insensitive' } },
              ...(/^\d+$/.test(q) && q.length < 10
                ? [{ lotNumber: Number(q) }]
                : []),
            ],
          }
        : undefined,
      orderBy: { lotNumber: 'asc' },
      ...page,
    });
    return lots.map(toLot);
  }

  async getLotById(id: string): Promise<CoffeeLot | undefined> {
    const l = await this.prisma.coffeeLot.findUnique({ where: { id } });
    return l ? toLot(l) : undefined;
  }

  async createLot(
    data: Omit<CoffeeLot, 'id' | 'lotNumber' | 'inAuction'>,
  ): Promise<CoffeeLot> {
    const l = await this.prisma.coffeeLot.create({
      data: {
        name: data.name,
        origin: data.origin,
        grade: data.grade,
        price: data.price,
        cuppingNotes: data.cuppingNotes,
        traceability: data.traceability,
        warehouse: data.warehouse,
        quantity: data.quantity,
        unit: data.unit,
        imageUrl: data.imageUrl,
        farmerId: data.farmerId,
        farmId: data.farmId,
      },
    });
    return toLot(l);
  }

  // ───── auctions ─────

  /** Open auctions first (closing soonest), then finished ones. */
  async getAuctions(page: Page = FIRST_PAGE): Promise<Auction[]> {
    const rows = await this.prisma.auction.findMany({
      include: { bids: true },
      // `active` is declared before `ended` in the enum, so it sorts first.
      orderBy: [{ status: 'asc' }, { endsAt: 'asc' }],
      ...page,
    });
    return rows.map(toAuction);
  }

  async getLotsByIds(ids: string[]): Promise<CoffeeLot[]> {
    if (ids.length === 0) return [];
    const lots = await this.prisma.coffeeLot.findMany({ where: { id: { in: ids } } });
    return lots.map(toLot);
  }

  async getAuctionByLotId(lotId: string): Promise<Auction | undefined> {
    const a = await this.prisma.auction.findUnique({
      where: { lotId },
      include: { bids: true },
    });
    return a ? toAuction(a) : undefined;
  }

  async placeBid(
    lotId: string,
    userId: string,
    bidderName: string,
    amount: number,
    autoBid = false,
  ): Promise<AuctionBid> {
    return this.prisma.$transaction(async (tx) => {
      const found = await tx.auction.findUnique({ where: { lotId } });
      if (!found) throw new NotFoundException('Auction not found');
      // Serialise concurrent bids on this auction.
      await tx.$queryRaw`SELECT id FROM "Auction" WHERE id = ${found.id} FOR UPDATE`;
      const auction = await tx.auction.findUniqueOrThrow({
        where: { id: found.id },
      });
      if (auction.status !== 'active' || auction.endsAt.getTime() <= Date.now()) {
        throw new BadRequestException('Auction has ended');
      }
      if (amount <= auction.currentBid) {
        throw new BadRequestException('Bid must be higher than current bid');
      }
      if (autoBid) {
        await tx.autoBidLimit.upsert({
          where: { auctionId_userId: { auctionId: auction.id, userId } },
          create: { auctionId: auction.id, userId, bidderName, maxAmount: amount },
          update: { bidderName, maxAmount: amount },
        });
      }
      const bid = await tx.bid.create({
        data: { auctionId: auction.id, userId, bidderName, amount },
      });
      const limits = await tx.autoBidLimit.findMany({
        where: { auctionId: auction.id },
      });
      const follow = planAutoBids(amount, userId, limits);
      for (const b of follow) {
        await tx.bid.create({ data: { auctionId: auction.id, ...b } });
      }
      const finalAmount = follow.length
        ? follow[follow.length - 1].amount
        : amount;
      await tx.auction.update({
        where: { id: auction.id },
        data: { currentBid: finalAmount },
      });
      return toBid(bid, lotId);
    });
  }

  // ───── cart ─────

  async getCart(userId: string): Promise<(CartItem & { lot: CoffeeLot })[]> {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { lot: true },
      orderBy: { id: 'asc' },
    });
    return items.map((c) => ({
      id: c.id,
      userId: c.userId,
      lotId: c.lotId,
      quantity: c.quantity,
      lot: toLot(c.lot),
    }));
  }

  async addToCart(userId: string, lotId: string, quantity = 1): Promise<CartItem> {
    return this.prisma.cartItem.upsert({
      where: { userId_lotId: { userId, lotId } },
      create: { userId, lotId, quantity },
      update: { quantity: { increment: quantity } },
    });
  }

  // ───── dashboard ─────

  async getDashboard(userId: string) {
    const [activeAuctions, pendingPayments, warehouseLots] = await Promise.all([
      this.prisma.auction.count({
        where: { status: 'active', endsAt: { gt: new Date() } },
      }),
      this.prisma.transaction.count({ where: { userId, status: 'pending' } }),
      this.prisma.coffeeLot.count({ where: { warehouse: 'b1a' } }),
    ]);
    return {
      pendingPayments,
      auctionStatus: `${activeAuctions} active auction${activeAuctions === 1 ? '' : 's'}`,
      warehouseLots,
    };
  }

  // ───── shipments (static demo data, not persisted) ─────

  getShipments(): Shipment[] {
    return this.shipments;
  }

  getShipmentById(id: string): Shipment | undefined {
    return this.shipments.find((s) => s.id === id);
  }

  verifyQrCode(code: string): Shipment | undefined {
    return this.shipments.find((s) => s.qrCode === code);
  }
}
