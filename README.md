# Dyp Farms Coffee App

A full-stack coffee marketplace and farm management platform with a **NestJS** backend and **React Native (Expo)** mobile app.

## Project Structure

```
dyp-farms-coffee/
├── backend/           # NestJS API server
├── mobile/            # React Native (Expo) app
├── packages/payments/ # @dyp/payments SDK (MTN MoMo, Airtel Money, extensible)
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
- `buyer@dypfarms.com` / `password123`
- `farmer@dypfarms.com` / `password123`

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
| POST | `/api/quality/scan` | AI quality scan |

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
