// Insert-only: adds the demo Kampala farms and touches nothing else.
// Safe to run against a live database (no deletes; existing farms with the same
// ids are left exactly as they are):
//   DATABASE_URL="<connection string>" npm run db:seed:farms
import { PrismaClient } from '@prisma/client';
import { OWNER_ID, seedFarms } from './seed-farms.data';

const prisma = new PrismaClient();

async function main() {
  const host = new URL(process.env.DATABASE_URL ?? 'postgresql://unset').host;
  console.log(`Adding ${seedFarms.length} farms to ${host} (insert-only)…`);
  const { count } = await prisma.farm.createMany({
    data: seedFarms.map((f) => ({ ...f, ownerId: OWNER_ID })),
    skipDuplicates: true,
  });
  console.log(
    `Inserted ${count}, skipped ${seedFarms.length - count} that already existed.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
