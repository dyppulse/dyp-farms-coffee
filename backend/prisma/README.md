# Database (Prisma + Postgres on Neon)

## Files

| File | Purpose |
| --- | --- |
| `schema.prisma` | The source of truth for tables. Edit this first. |
| `migrations/` | SQL history applied in order by `prisma migrate deploy`. Currently one clean `…_baseline`. |
| `../prisma.config.ts` | Prisma config: schema path, migrations path, seed command, `.env` loading. |
| `seed.ts` | Full **dev** seed. Wipes tours/orders/etc. first — never run it on a live database. |
| `seed-farms.ts` | **Insert-only** demo farms. Safe on a live database. |

## Two connection strings

Neon gives you a *pooled* and a *direct* string. Use both:

- `DATABASE_URL` — **pooled** (host contains `-pooler`). Used by the running API.
  Add `?sslmode=require&pgbouncer=true&connect_timeout=15`.
- `DIRECT_URL` — **direct** (no `-pooler`). Used by `prisma migrate`, which can't run
  through the pooler. Add `?sslmode=require&connect_timeout=15`.

Locally both point at the docker Postgres (see `.env.example`).

## One-time Neon setup

1. Create a Neon project (region near Render's Oregon service, e.g. `us-west-2`).
2. In Neon → Connection details, copy the pooled and the direct string.
3. Render → `dyp-farms-api` → Environment: set `DATABASE_URL` (pooled) and `DIRECT_URL` (direct).
4. Deploy. The build runs `prisma migrate deploy`, which creates every table.
5. Optional demo farms, from your machine:

   ```bash
   DATABASE_URL="<direct string>" DIRECT_URL="<direct string>" npm run db:seed:farms
   ```

   It prints the target host first — check it says a Neon host.

## Everyday workflow

```bash
# change schema.prisma, then:
npm run db:migrate -- --name what_changed   # creates + applies a migration locally
git add prisma && git commit                # migrations are code; commit them
# push → Render's build runs `prisma migrate deploy` against Neon
```

- Never edit a migration that has been deployed; add a new one.
- `db:push` is for throwaway experiments only — it skips migration history.
- `db:reset` wipes the database it points at. It is refused for AI tooling and should
  only ever target local dev.
- A deploy fails fast if the database is unreachable (the migrate step runs in the build),
  so a bad `DIRECT_URL` shows up as a failed deploy rather than a broken live service.
