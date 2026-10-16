import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { loadDemoData, seedDemoData } from './demo-data.seeder';
import { auctions, coffeeLots, users } from './seed.data';
import { buildSeedUsers } from './seed-users';

/**
 * Boot-time seeding.
 * - Production: only the env-configured admin (ADMIN_EMAIL / ADMIN_PASSWORD) is upserted.
 *   No demo users, lots or auctions are ever created.
 * - Elsewhere: demo users are inserted if missing, and demo lots/auctions only when the
 *   lot table is empty. Existing rows (e.g. real signups) are never overwritten.
 */
@Injectable()
export class DemoSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoSeedService.name);

  constructor(private prisma: PrismaService) {}

  async onApplicationBootstrap() {
    try {
      await this.seed();
    } catch (error) {
      this.logger.error(`Seeding failed: ${(error as Error).message}`);
    }
    this.startLargeDemoSeed();
  }

  /**
   * The large test dataset (1,000 farmers across Uganda, lots, auctions, bids and more) is
   * only loaded when SEED_DEMO_DATA=true, in any environment including production. It runs
   * in the background so it never delays startup, is safe to repeat, and keeps the
   * evergreen demo auctions open. Remove it with `npm run demo:remove`.
   */
  private startLargeDemoSeed(env: NodeJS.ProcessEnv = process.env) {
    if (env.SEED_DEMO_DATA !== 'true') return;
    void (async () => {
      try {
        const started = Date.now();
        const result = await seedDemoData(this.prisma as never, loadDemoData());
        this.logger.log(
          `Demo dataset ready in ${Math.round((Date.now() - started) / 1000)}s: ${JSON.stringify(result)}`,
        );
      } catch (error) {
        this.logger.error(`Demo dataset failed: ${(error as Error).message}`);
      }
    })();
  }

  async seed(env: NodeJS.ProcessEnv = process.env) {
    const production = env.NODE_ENV === 'production';
    const seedUsers = buildSeedUsers(users, env);

    if (production) {
      const admin = seedUsers.find((u) => u.id === 'admin-env');
      if (admin) {
        await this.prisma.user.upsert({
          where: { email: admin.email },
          create: {
            id: admin.id,
            email: admin.email,
            passwordHash: admin.password,
            name: admin.name,
            role: 'admin',
          },
          update: { passwordHash: admin.password, role: 'admin' },
        });
      }
      return;
    }

    if (seedUsers.length === 0) return;
    await this.prisma.user.createMany({
      data: seedUsers.map((u) => ({
        id: u.id,
        email: u.email,
        passwordHash: u.password,
        name: u.name,
        role: u.role,
      })),
      skipDuplicates: true,
    });

    if ((await this.prisma.coffeeLot.count()) > 0) return;
    const present = new Set(
      (await this.prisma.user.findMany({ select: { id: true } })).map(
        (u) => u.id,
      ),
    );
    const lots = coffeeLots.filter(
      (l) => !l.farmerId || present.has(l.farmerId),
    );
    if (lots.length === 0) return;

    await this.prisma.coffeeLot.createMany({
      data: lots.map((l) => ({
        id: l.id,
        lotNumber: Number(l.lotNumber),
        name: l.name,
        origin: l.origin,
        grade: l.grade,
        price: l.price,
        cuppingNotes: l.cuppingNotes,
        traceability: l.traceability,
        warehouse: l.warehouse,
        quantity: l.quantity,
        unit: l.unit,
        inAuction: l.inAuction,
        farmerId: l.farmerId,
      })),
    });
    // Explicit lotNumbers bypass the sequence; move it past them.
    await this.prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"CoffeeLot"', 'lotNumber'), (SELECT MAX("lotNumber") FROM "CoffeeLot"))`;

    const lotIds = new Set(lots.map((l) => l.id));
    for (const a of auctions.filter((x) => lotIds.has(x.lotId))) {
      await this.prisma.auction.create({
        data: {
          id: a.id,
          lotId: a.lotId,
          currentBid: a.currentBid,
          endsAt: new Date(a.endsAt),
          status: a.status,
          bids: {
            create: a.bids
              .filter((b) => present.has(b.userId))
              .map((b) => ({
                id: b.id,
                userId: b.userId,
                bidderName: b.bidderName,
                amount: b.amount,
                createdAt: new Date(b.createdAt),
              })),
          },
        },
      });
    }
    this.logger.log('Seeded demo users, lots and auctions');
  }
}
