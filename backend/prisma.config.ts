// Prisma config (replaces the deprecated `package.json#prisma` block).
// NOTE: when a config file exists Prisma stops auto-loading `.env`, so load it here.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
});
