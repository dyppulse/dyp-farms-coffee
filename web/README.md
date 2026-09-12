# Dyp Farms Coffee — Web

React + Vite + TypeScript + MUI web app for buyers, farmers, and platform admins. It talks to
the same backend as the mobile app (`../backend`) — same `/auth`, `/lots`, `/auctions`, `/farms`,
`/notifications`, `/tickets` contract.

## Who uses this

- **Buyers (roasters)** — marketplace search/filter and auction bidding, with a keyboard-first
  UI better suited to desktop than the mobile app.
- **Farmers** — manage registered farms (GPS/boundary), same data as the mobile app's farm
  registration, plus notifications and support tickets.
- **Admins** — platform stats, a Google-Maps view of every registered farm, and a support
  tickets queue. Admin accounts are seed-only (see `backend/src/common/data/seed.data.ts`) —
  there's no self-serve admin signup.

## Setup

```bash
npm install
cp .env.example .env   # then fill in VITE_API_URL / VITE_GOOGLE_MAPS_API_KEY
npm run dev
```

- `VITE_API_URL` — defaults to the deployed Render API; point it at `http://localhost:3001/api`
  for local backend development.
- `VITE_GOOGLE_MAPS_API_KEY` — only needed for the farmer "Add Farm" map and the admin Farms
  Map. Without it, both pages still work (farm creation falls back to name-only; the admin map
  shows a text list instead of a map) — get a key at
  https://console.cloud.google.com/google/maps-apis and enable "Maps JavaScript API".

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — typecheck (`tsc -b`) + production build
- `npm run lint` — oxlint
- `npm run preview` — preview the production build locally
