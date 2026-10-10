# Dyp Farms Coffee App

A full-stack coffee marketplace and farm management platform with a **NestJS** backend and **React Native (Expo)** mobile app.

## Documentation

📋 **[Technical Specification](./TECH_SPEC.md)** — Complete architecture, API design, tech stack, security, testing strategy, and roadmap. Start here for a comprehensive understanding of the system.

📝 **[Testing Guide](./TESTING.md)** — Jest, Playwright, and Detox setup for unit, integration, and E2E testing.

🚀 **[Deployment Guide](./DEPLOYMENT.md)** — Comprehensive deployment guide for Google Play Store (mobile) and free hosting platforms (backend). Includes Render and Fly.io setup.

⚡ **[DEPLOY NOW](./DEPLOY_NOW.md)** — Quick-start deployment checklist. Follow this to go live in 2-5 days! Backend live today, Play Store approval in 1-3 days.

## Project Structure

```
dyp-farms-coffee/
├── backend/           # NestJS API server
├── mobile/            # React Native (Expo) app
├── packages/payments/ # @dyp/payments SDK (MTN MoMo, Airtel Money, extensible)
├── TECH_SPEC.md       # Technical specification document
├── TESTING.md         # Testing strategy and framework guides
└── docker-compose.yml # PostgreSQL for local dev
```

## Features

- **Authentication** — Sign up & login
- **Dashboard** — Wallet balance, quick actions, weather insights, warehouse lots
- **Coffee Marketplace** — Browse, search, and purchase coffee lots
- **Live Auctions** — Place bids with auto-bid support
- **Digital Wallet** — Add funds, withdraw, transaction history (UGX)
- **Logistics Tracking** — Shipment timeline with QR verification
- **AI Quality Check** — Scan and grade coffee lots
- **Farm Tours** — Browse tours with locations, book time slots, pay via MTN/Airtel mobile money, receive email + virtual ticket

## Getting Started

### Prerequisites

- Node.js 20+ (Node 20.19.4+ for Expo SDK 54)
- npm
- Docker (for PostgreSQL)
- Expo Go app (for mobile testing) or iOS/Android simulator

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Start the Backend

```bash
cd backend
cp .env.example .env   # edit with your credentials
npm install
npx prisma migrate deploy
npm run db:seed
npm run start:dev
```

API runs at `http://localhost:3001/api`

**Demo accounts:**
- `farmer@dypfarms.com` / `password123` (farmer)
- `buyer@dypfarms.com` / `password123` (roaster)
- `tourist@dypfarms.com` / `password123` (tourist)

### 3. Start the Mobile App

```bash
cd mobile
npm install
npm start
```

On a physical device, the app auto-detects your machine IP from the Expo dev server. Ensure phone and computer are on the same Wi‑Fi.

### Mobile money (production)

Set real credentials in `backend/.env`:

- **MTN MoMo** — [momodeveloper.mtn.com](https://momodeveloper.mtn.com)
- **Airtel Money** — [developers.airtel.africa](https://developers.airtel.africa)

For local webhook testing, expose your API with ngrok and set `MTN_MOMO_CALLBACK_URL` / `AIRTEL_CALLBACK_URL`.

Without credentials, set `PAYMENTS_MOCK=true` to use simulated payments (dev only).

### Email

Set `SMTP_*` variables in `.env` to send booking confirmation emails with QR tickets. Without SMTP, confirmations are logged to the backend console.

## Building the Mobile App (EAS)

Android builds run on Expo's servers through [EAS Build](https://docs.expo.dev/build/introduction/). The project is already linked (`owner: dyppulse` in `mobile/app.config.ts`) and `mobile/eas.json` defines the profiles.

| Profile | Output | Use it for |
|--------|--------|------------|
| `preview` | APK with an install link and QR code | Handing a test build to people directly, no Play Store involved |
| `production` | Android App Bundle (`.aab`) | Uploading to Google Play (internal, closed or production tracks) |

Both profiles talk to the deployed API (`API_URL` is set in `eas.json`) and `production` auto-increments the version code.

### One-time setup

1. **Install and sign in** (use the `dyppulse` Expo account):

   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Add the Google Maps key to EAS.** EAS cloud builds do *not* read `mobile/.env`. Without this key the farm-boundary map is blank on Android.
   - In Google Cloud, enable **Maps SDK for Android** (a different API from the Maps JavaScript API used by the web app) and create an API key restricted to that API.
   - Store it in EAS as a secret for both profiles. The command asks for the value, so it never lands in your shell history:

     ```bash
     eas env:create --name GOOGLE_MAPS_API_KEY --environment preview --environment production --visibility secret
     ```

   - Check it exists (the value is hidden): `eas env:list preview`
   - Once you have a signing certificate, restrict the key to package `com.dypfarms.coffee` plus its SHA-1 (`eas credentials` shows the EAS keystore SHA-1; Google Play App Signing has its own SHA-1 too).

### Build

**Run these from the `mobile/` folder**, not the repo root or a parent folder:

```bash
cd mobile
eas build --platform android --profile preview
```

- First build only: when asked, let EAS **generate a new Android keystore** and manage it. This step needs an interactive terminal; it can't run with `--non-interactive`.
- A build takes roughly 15 to 30 minutes. Follow it on the link EAS prints or on the Builds page at `expo.dev`.
- When it finishes, open the install link on an Android phone or scan the QR code. Allow installs from your browser if prompted.
- For Google Play, use `--profile production` instead and upload the `.aab` in Play Console (see [DEPLOYMENT.md](./DEPLOYMENT.md)).

### Troubleshooting

| Symptom | Cause and fix |
|--------|----------------|
| `package.json is outside of the current git repository` | You ran the command from the wrong folder. `cd mobile` first. |
| Farm map is blank on Android | `GOOGLE_MAPS_API_KEY` is missing in EAS, or Maps SDK for Android is not enabled on the key. Fix it, then rebuild (env vars are baked in at build time). |
| App says "Cannot reach API" | The Render API may be asleep (free tier delays the first request by about 50 seconds) or down. Check `https://dyp-farms-api.onrender.com/api/health`. |
| `Generating a new Keystore is not supported in --non-interactive mode` | Run the first build in a normal terminal without `--non-interactive`. |

> **Heads up:** the demo accounts (`farmer@dypfarms.com`, `admin@dypfarms.com`, and so on, all with `password123`) are loaded in memory on every environment, including the live API. Don't share a build or the API URL widely until that is locked down.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/dashboard` | Dashboard data (auth) |
| GET | `/api/wallet` | Wallet balance & transactions (auth) |
| GET | `/api/wallet/payment-methods` | Available payment methods (auth) |
| POST | `/api/wallet/add-funds` | Add funds (auth) |
| POST | `/api/wallet/withdraw` | Withdraw (auth) |
| GET | `/api/tours` | List tours with locations |
| GET | `/api/tours/:id` | Tour detail |
| GET | `/api/tours/:id/slots` | Available time slots |
| GET | `/api/tours/reviews` | Tour reviews |
| POST | `/api/tours/:id/bookings` | Create booking + initiate payment (auth) |
| GET | `/api/bookings` | User bookings (auth) |
| GET | `/api/bookings/:id` | Booking detail (auth) |
| GET | `/api/bookings/:id/ticket` | Virtual ticket (auth) |
| GET | `/api/bookings/verify?code=` | Verify ticket QR |
| POST | `/api/webhooks/mtn-momo` | MTN payment webhook |
| POST | `/api/webhooks/airtel-money` | Airtel payment webhook |
| GET | `/api/lots` | List coffee lots |
| GET | `/api/auctions` | List auctions |
| GET | `/api/logistics` | List shipments |
| POST | `/api/quality/scan` | AI quality scan (multipart `image` + Gemini vision) |

## Testing

```bash
cd backend
docker compose -f ../docker-compose.yml up -d
npx prisma migrate deploy && npm run db:seed
npm run test:e2e
```

## @dyp/payments SDK

Reusable payments package at `packages/payments/`. Install in other projects:

```bash
npm install file:../packages/payments
```

Register MTN/Airtel providers via `createPaymentGateway()` or add new providers implementing `PaymentProvider`.
# dyp-farms-coffee
