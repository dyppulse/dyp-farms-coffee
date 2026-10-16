// Seeds (or removes) the demo dataset in whatever database DATABASE_URL points at.
//
//   npm run demo:seed      insert / refresh the demo data (safe to repeat)
//   npm run demo:remove    delete the demo data and nothing else
//
// Render does the same thing on boot when SEED_DEMO_DATA=true (see DemoSeedService).
import { PrismaClient } from '@prisma/client';
import { loadDemoData, removeDemoData, seedDemoData } from '../../src/common/data/demo-data.seeder';

const prisma = new PrismaClient();

async function main() {
  const host = new URL(process.env.DATABASE_URL ?? 'postgresql://unset').host;
  if (process.argv[2] === 'remove') {
    console.log(`Removing demo data from ${host}…`);
    console.log(await removeDemoData(prisma));
    return;
  }
  console.log(`Seeding demo data into ${host}…`);
  console.log(await seedDemoData(prisma, loadDemoData()));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
