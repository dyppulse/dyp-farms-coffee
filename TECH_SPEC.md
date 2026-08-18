# Dyp Farms Coffee - Technical Specification

**Version:** 1.0.0  
**Last Updated:** August 18, 2026  
**Status:** Active Development

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Backend Specification](#backend-specification)
5. [Mobile Application](#mobile-application)
6. [Database & Data](#database--data)
7. [API Specification](#api-specification)
8. [Security](#security)
9. [Testing Strategy](#testing-strategy)
10. [Deployment](#deployment)
11. [Development Setup](#development-setup)
12. [Performance Considerations](#performance-considerations)
13. [Future Roadmap](#future-roadmap)

---

## 1. Project Overview

### 1.1 Vision
Dyp Farms Coffee is a comprehensive platform connecting coffee farmers, roasters, buyers, and tourists in a transparent, blockchain-ready ecosystem. The platform enables quality assessment, fair-price auctions, sustainable financing, and authentic farm experiences.

### 1.2 Core Features
- **Quality Grading**: AI-powered image recognition for coffee bean assessment
- **Live Auctions**: Real-time bidding on coffee lots with instant settlement
- **Financing**: Flexible loans up to 80% of warehouse receipt collateral
- **Subscriptions**: Tiered delivery models (Starter, Enthusiast, Connoisseur)
- **Logistics Tracking**: Real-time shipment monitoring with QR verification
- **Carbon Footprint**: Environmental impact calculation and offsetting
- **Community**: Discussion forums, peer support, and live chat
- **Coffee Tours**: Farm experiences and booking management
- **Wallet System**: Multi-currency payment and transaction management
- **AI Assistant**: Intelligent chatbot for platform guidance

### 1.3 Target Users
- **Farmers**: Harvest management, auction participation, financing
- **Roasters**: Lot sourcing, quality verification, subscription management
- **Buyers**: Marketplace browsing, auction bidding, subscription ordering
- **Tourists**: Farm tour discovery and booking

---

## 2. Architecture

### 2.1 Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Mobile (React Native/Expo)  │  Web (React/Next.js)        │
│  iOS/Android/Web             │  Browser (Future)            │
└──────────────────┬──────────────────────────────────────────┘
                   │ REST API / JSON
                   ↓
┌─────────────────────────────────────────────────────────────┐
│               API Gateway & Middleware                      │
├─────────────────────────────────────────────────────────────┤
│  NestJS (Express) - Port 3001                               │
│  - CORS Handling                                            │
│  - JWT Authentication                                       │
│  - Request Validation                                       │
│  - Error Handling                                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ↓          ↓          ↓
┌──────────────┐ ┌────────────────┐ ┌──────────────────┐
│   Database   │ │  External APIs │ │  File Storage    │
│  (Prisma)    │ │  - OpenAI      │ │  (ImageKit/S3)   │
│  - PostgreSQL│ │  - Payment     │ │  (Future)        │
│  - In-Memory │ │  - Weather     │ └──────────────────┘
└──────────────┘ └────────────────┘
```

### 2.2 Application Layers

**Presentation Layer:**
- React Native UI components
- Theme system with role-based customization
- Screen hierarchy via Expo Router

**Business Logic Layer:**
- NestJS modules and services
- Authentication & Authorization
- Business rule enforcement
- Data transformation

**Data Access Layer:**
- Prisma ORM (for future database integration)
- In-memory store (StoreService) for current MVP
- Data validation and sanitization

**Infrastructure Layer:**
- REST API endpoints
- Third-party API integrations
- File handling
- Logging and monitoring

---

## 3. Technology Stack

### 3.1 Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | 20.19.4+ | JavaScript runtime |
| Framework | NestJS | 11.0.1 | TypeScript framework for APIs |
| Language | TypeScript | 5.7.3 | Type-safe JavaScript |
| API | Express | 5.0.0 | HTTP server (via NestJS) |
| ORM | Prisma | 6.9.0 | Database abstraction (Future) |
| Auth | JWT | 11.0.2 | Token-based authentication |
| Validation | class-validator | 0.15.1 | DTO validation |
| Transformation | class-transformer | 0.5.1 | Object mapping |
| Testing | Jest | 30.0.0 | Unit & integration testing |
| Linting | ESLint | 9.18.0 | Code quality |
| Formatting | Prettier | 3.4.2 | Code formatting |

### 3.2 Mobile

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | React Native | 0.81.5 | Cross-platform mobile UI |
| Bundler | Expo | 54.0.0 | Build and deployment |
| Routing | Expo Router | 6.0.24 | Navigation and deep linking |
| Language | TypeScript | 5.3.0 | Type-safe JavaScript |
| Testing | Jest | 29.7.0 | Unit testing |
| Testing | Detox | 20.15.0 | E2E testing (native) |
| Testing | Playwright | 1.40.0 | E2E testing (web) |
| Icons | Expo Vector Icons | 15.0.3 | Icon library |
| Fonts | Expo Google Fonts | 0.4.x | Custom typography |
| Storage | Expo Secure Store | 15.0.8 | Secure credential storage |

### 3.3 Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| pnpm | Latest | Package manager |
| Git | Latest | Version control |
| Husky | 9.1.7 | Git hooks |
| lint-staged | 16.4.0 | Pre-commit linting |

---

## 4. Backend Specification

### 4.1 Project Structure

```
backend/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── auth/                   # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.guard.ts
│   │   ├── auth.module.ts
│   │   └── dto/
│   ├── ai/                     # AI Assistant module
│   │   ├── ai.controller.ts
│   │   ├── ai.service.ts
│   │   ├── ai.module.ts
│   │   └── ai.service.ts       # OpenAI integration + fallback
│   ├── carbon/                 # Carbon Footprint module
│   │   ├── carbon.controller.ts
│   │   ├── carbon.service.ts
│   │   └── carbon.module.ts
│   ├── auctions/               # Auctions module
│   ├── bookings/               # Bookings module
│   ├── community/              # Community module
│   ├── dashboard/              # Dashboard module
│   ├── financing/              # Financing module
│   ├── logistics/              # Logistics module
│   ├── lots/                   # Coffee Lots module
│   ├── notifications/          # Notifications module
│   ├── quality/                # Quality Assessment module
│   ├── receipts/               # Warehouse Receipts module
│   ├── subscriptions/          # Subscriptions module
│   ├── tours/                  # Tours module
│   ├── wallet/                 # Wallet & Payments module
│   ├── weather/                # Weather module
│   ├── common/                 # Shared utilities
│   │   ├── data/
│   │   │   ├── store.module.ts
│   │   │   ├── store.service.ts    # In-memory data store
│   │   │   └── seed.data.ts        # Mock data
│   │   ├── interfaces/
│   │   └── decorators/
│   └── prisma/                 # Database (future)
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
└── package.json
```

### 4.2 Core Modules

#### Authentication Module (auth)
- **Purpose**: User authentication and authorization
- **Key Components**:
  - `AuthService`: Login, signup, token management
  - `JwtAuthGuard`: Route protection decorator
  - `AuthController`: /auth endpoints
- **Key Endpoints**:
  - POST /auth/login
  - POST /auth/signup
  - POST /auth/refresh-token

#### AI Assistant Module (ai)
- **Purpose**: Intelligent chatbot with OpenAI integration
- **Features**:
  - Real OpenAI GPT-3.5-turbo when API available
  - Intelligent keyword-based fallback
  - Conversation history (last 10 exchanges)
  - System prompt with platform context
- **Key Endpoints**:
  - POST /ai/chat/start
  - POST /ai/chat/:conversationId/message
  - GET /ai/chat/:conversationId
  - POST /ai/chat/:conversationId/clear

#### Carbon Footprint Module (carbon)
- **Purpose**: Environmental impact tracking
- **Features**:
  - Emission factors by region, certification, transport
  - Carbon certification levels (Carbon Neutral → High Impact)
  - Annual impact projections
  - Offset cost calculations
  - Project recommendations
- **Key Endpoints**:
  - POST /carbon/calculate
  - GET /carbon/region-stats
  - POST /carbon/annual-impact
  - GET /carbon/offset-projects

#### Quality Assessment Module (quality)
- **Purpose**: AI-powered coffee quality grading
- **Features**:
  - Image-based bean analysis
  - Grade assignment (A+, A, B, C)
  - Quality score (0-100)
  - Moisture estimation
  - Defect detection
- **Key Endpoints**:
  - POST /quality/scan (with image upload)
  - GET /quality/:id

#### Auctions Module (auctions)
- **Purpose**: Real-time bidding system
- **Features**:
  - Live auction listings
  - Bid placement and auto-bidding
  - Countdown timers
  - Bid history tracking
- **Key Endpoints**:
  - GET /auctions
  - POST /auctions/:lotId/bid
  - GET /auctions/:lotId

#### Logistics Module (logistics)
- **Purpose**: Shipment tracking
- **Features**:
  - Real-time location tracking
  - QR code verification
  - Multi-checkpoint tracking
  - Authenticity verification
- **Key Endpoints**:
  - GET /logistics
  - GET /logistics/:id
  - POST /logistics/verify/qr

### 4.3 API Response Format

**Standard Response:**
```json
{
  "data": {},
  "meta": {
    "timestamp": "2026-08-18T10:30:00Z",
    "version": "1.0"
  }
}
```

**Error Response:**
```json
{
  "message": "Error description",
  "statusCode": 400,
  "timestamp": "2026-08-18T10:30:00Z"
}
```

### 4.4 Authentication

**Method**: JWT (JSON Web Tokens)

**Token Structure:**
```
Header: { alg: "HS256", typ: "JWT" }
Payload: { 
  sub: userId,
  email: userEmail,
  role: userRole,
  iat: issuedAt,
  exp: expiration
}
```

**Protected Routes**: All routes except /auth use `@UseGuards(JwtAuthGuard)`

**Token Lifecycle:**
- Issued on login/signup
- Stored in secure storage (mobile) / localStorage (web)
- Sent in `Authorization: Bearer <token>` header
- 7-day expiration (configurable)

---

## 5. Mobile Application

### 5.1 Project Structure

```
mobile/
├── app/
│   ├── index.tsx               # Root navigation
│   ├── _layout.tsx             # Stack navigator
│   ├── (auth)/                 # Auth screens
│   │   ├── splash.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── role-select.tsx
│   ├── (tabs)/                 # Tab-based navigation
│   │   ├── _layout.tsx
│   │   ├── index.tsx           # Home/Dashboard
│   │   ├── harvest.tsx         # Farming
│   │   ├── marketplace.tsx     # Browse & Bid
│   │   ├── orders.tsx          # Order history
│   │   ├── wallet.tsx          # Payments
│   │   ├── profile.tsx         # User profile
│   │   ├── track.tsx           # Logistics
│   │   └── tours.tsx           # Tourism
│   ├── ai-assistant.tsx        # AI Chat (modal)
│   ├── cart.tsx
│   ├── quality.tsx             # Quality scanning
│   ├── notifications.tsx       # Notifications
│   ├── lot/
│   ├── auction/
│   ├── booking/
│   ├── logistics/
│   └── tour/
├── src/
│   ├── api/
│   │   ├── client.ts           # API client with endpoints
│   │   └── __tests__/
│   ├── context/
│   │   └── AuthContext.tsx     # Auth state management
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── CarbonFootprint.tsx
│   │   ├── StatusPill.tsx
│   │   ├── FilterChips.tsx
│   │   ├── SegmentedControl.tsx
│   │   ├── ScreenHeader.tsx
│   │   └── __tests__/
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── storage.service.ts
│   ├── theme/
│   │   ├── colors.ts           # Color palette
│   │   └── typography.ts       # Font definitions
│   └── hooks/
│       └── useAuth.ts
├── e2e/
│   ├── playwright/             # Web E2E tests
│   │   ├── auth.spec.ts
│   │   └── marketplace.spec.ts
│   └── detox/                  # Native E2E tests
│       ├── login.e2e.ts
│       └── marketplace.e2e.ts
├── jest.setup.js               # Jest config
├── jest.config.ts
├── playwright.config.ts        # Playwright config
├── .detoxrc.json               # Detox config
└── package.json
```

### 5.2 Navigation Structure

**Stack Navigation (Auth/Protected):**
```
Root (Stack)
├── Auth Stack (conditionally shown)
│   ├── Splash
│   ├── Login
│   ├── Signup
│   └── Role Select
├── Tabs (main navigation)
│   ├── Home (role-based dashboard)
│   ├── Feature tabs (role-specific)
│   └── Profile
└── Modal Screens
    ├── AI Assistant
    ├── Notifications
    ├── Cart
    ├── Quality Scanner
    └── Details (lot, auction, booking, etc.)
```

**Role-Based Tab Visibility:**
- **Farmer**: Home, Harvest, Wallet, Track, Profile
- **Roaster**: Home, Marketplace, Orders, Wallet, Profile
- **Tourist**: Home, Tours, Marketplace, Wallet, Profile
- **Buyer**: Home, Marketplace, Orders, Wallet, Profile

### 5.3 Theme System

**Color Palette:**
```typescript
colors = {
  // Primary
  navy: '#0C2340',
  navy2: '#1E3A5F',
  
  // Accent Colors by Role
  farmerGreen: '#22C55E',
  farmerGreenDark: '#16A34A',
  roasterBrown: '#78350F',
  touristPurple: '#9333EA',
  buyerBlue: '#3B82F6',
  
  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  // Neutral
  background: '#F9FAFB',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  lavender: '#E9D5FF',
  
  // Text
  text: '#1F2937',
  textMuted: '#9CA3AF',
  white: '#FFFFFF',
}
```

**Typography:**
- **Display**: Poppins (bold, semi-bold)
- **Body**: Inter (regular, medium)
- **Sizes**: 12px (small), 14px (body), 16px (large), 20px+ (headings)

### 5.4 Key Features

**Authentication Flow:**
1. Launch app → Splash screen
2. Check if logged in (token in secure storage)
3. If not → Login/Signup → Role Select
4. If yes → Load dashboard (role-based)
5. Fetch user data and initialize app state

**Dashboard (Role-Based):**
- **Farmer**: Harvest management, pending payments, active auctions
- **Roaster**: Available lots, current subscriptions, order history
- **Tourist**: Nearby tours, bookings, profile
- **Buyer**: Auction highlights, cart, orders

**API Integration:**
- Base URL: `http://{machine-ip}:3001/api` (dev)
- Auto-detects developer machine IP for local testing
- Falls back to configured URL for production
- Includes auth token in all protected requests

---

## 6. Database & Data

### 6.1 Data Store Strategy

**Current (MVP):**
- In-memory data store (`StoreService`)
- Mock data initialized at startup (`seed.data.ts`)
- No persistence (resets on server restart)

**Future (Post-MVP):**
- PostgreSQL database
- Prisma ORM for type-safe queries
- Migrations for schema management

### 6.2 Data Models

#### User
```typescript
interface User {
  id: string;
  email: string;
  password: (hashed);
  name: string;
  role: 'farmer' | 'roaster' | 'tourist' | 'buyer';
  location?: { lat: number; lng: number };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

#### Coffee Lot
```typescript
interface CoffeeLot {
  id: string;
  lotNumber: string;
  name: string;
  origin: string;              // Ethiopia, Colombia, Kenya, etc.
  variety: string;             // Arabica, Robusta, etc.
  grade: string;               // A+, A, B, C
  quality: QualityScore;
  price: number;               // Price per kg
  quantity: number;
  unit: string;                // kg, lbs
  cuppingNotes: string;
  traceability: string;
  warehouse: string;
  inAuction: boolean;
  carbonFootprint?: CarbonFootprint;
  createdAt: string;
  updatedAt: string;
}
```

#### Auction
```typescript
interface Auction {
  id: string;
  lotId: string;
  currentBid: number;
  minimumBid: number;
  bidIncrement: number;
  startsAt: string;
  endsAt: string;
  status: 'pending' | 'live' | 'closed' | 'sold';
  bids: Bid[];
  winnerId?: string;
  createdAt: string;
}
```

#### Conversation (AI Chat)
```typescript
interface Conversation {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}
```

#### Carbon Footprint
```typescript
interface CarbonFootprint {
  lotId: string;
  totalCo2kg: number;
  farming: number;
  processing: number;
  transportation: number;
  packaging: number;
  offsetCost: number;
  offsetProjects: string[];
  certification: 'Carbon Neutral' | 'Low Carbon' | 'Standard' | 'High Impact';
  createdAt: string;
}
```

### 6.3 Mock Data

Pre-populated datasets for MVP:
- 20+ coffee lots (various origins and grades)
- 5+ live auctions
- 3+ active tours
- 10+ transactions per user
- 3+ subscription tiers

---

## 7. API Specification

### 7.1 API Base Structure

```
http://localhost:3001/api/{resource}/{action}
```

### 7.2 Core Endpoints

#### Authentication
```
POST   /auth/login           - Login with email/password
POST   /auth/signup          - Create new account
GET    /auth/verify          - Verify token validity
POST   /auth/refresh         - Refresh access token
```

#### Dashboard
```
GET    /dashboard            - Get role-based dashboard data
GET    /dashboard/{userId}   - Get user dashboard
```

#### Coffee Lots
```
GET    /lots                 - List lots (with search, filter, sort)
GET    /lots/{id}            - Get lot details
POST   /lots                 - Create new lot (admin)
PUT    /lots/{id}            - Update lot
DELETE /lots/{id}            - Remove lot
```

#### Auctions
```
GET    /auctions             - List active auctions
GET    /auctions/{lotId}     - Get auction details
POST   /auctions/{lotId}/bid - Place bid
GET    /auctions/{lotId}/history - Bid history
```

#### Quality Assessment
```
POST   /quality/scan         - Scan coffee (image upload)
GET    /quality/{id}         - Get quality result
PUT    /quality/{id}/approve - Approve assessment
```

#### Carbon Footprint
```
POST   /carbon/calculate     - Calculate footprint
GET    /carbon/region-stats  - Region emission data
POST   /carbon/annual-impact - Project annual impact
GET    /carbon/offset-projects - Get offset recommendations
```

#### AI Assistant
```
POST   /ai/chat/start                 - Start new conversation
POST   /ai/chat/{conversationId}/message - Send message
GET    /ai/chat/{conversationId}      - Get conversation history
POST   /ai/chat/{conversationId}/clear - Clear conversation
```

#### Wallet & Payments
```
GET    /wallet               - Get user wallet
POST   /wallet/add-funds     - Add funds
POST   /wallet/withdraw      - Withdraw funds
GET    /wallet/transactions  - Transaction history
POST   /wallet/transfer      - Transfer to user
```

#### Logistics
```
GET    /logistics            - List shipments
GET    /logistics/{id}       - Get shipment details
POST   /logistics/verify/qr  - Verify QR code
```

#### Tours
```
GET    /tours                - List tours
GET    /tours/{id}           - Get tour details
GET    /tours/{id}/slots     - Available time slots
POST   /tours/{id}/book      - Book tour
GET    /tours/{id}/reviews   - Tour reviews
```

#### Bookings
```
GET    /bookings             - List user bookings
GET    /bookings/{id}        - Get booking details
POST   /bookings/{id}/cancel - Cancel booking
```

#### Community
```
GET    /community/posts      - List posts
POST   /community/posts      - Create post
POST   /community/posts/{id}/like - Like post
POST   /community/posts/{id}/replies - Reply to post
```

### 7.3 Request/Response Examples

**Login Request:**
```bash
POST /auth/login
Content-Type: application/json
{
  "email": "farmer@example.com",
  "password": "securePassword123"
}
```

**Login Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "farmer@example.com",
    "name": "John Farmer",
    "role": "farmer"
  }
}
```

**AI Chat Message Request:**
```bash
POST /ai/chat/conv-123456/message
Authorization: Bearer {token}
Content-Type: application/json
{
  "message": "How do I bid on lots?"
}
```

**AI Chat Message Response:**
```json
{
  "conversationId": "conv-123456",
  "messages": [
    {
      "role": "assistant",
      "content": "Our Live Auction feature lets you browse premium coffee lots and place real-time bids..."
    },
    {
      "role": "user",
      "content": "How do I bid on lots?"
    }
  ]
}
```

---

## 8. Security

### 8.1 Authentication & Authorization

**JWT Security:**
- Tokens signed with HS256 algorithm
- 7-day expiration
- Refresh token mechanism (future)
- Token stored in secure storage (mobile) / secure httpOnly cookie (web)

**Password Security:**
- Bcrypt hashing (cost factor 10)
- Minimum 8 characters
- Stored never in plain text

**Protected Routes:**
- All API endpoints require valid JWT token
- Guard: `@UseGuards(JwtAuthGuard)`
- Exception: /auth/login, /auth/signup

### 8.2 Data Security

**Data Validation:**
- DTO-based validation using class-validator
- Whitelist transformation (only known properties)
- Type coercion with class-transformer

**CORS Configuration:**
- Allow all origins (dev) / specific origins (production)
- Credentials enabled
- Common methods: GET, POST, PUT, DELETE, PATCH

**Rate Limiting:**
- Recommended: 100 requests/minute per IP
- Implement via middleware (future)

### 8.3 Payment Security

**Card Storage:**
- Never stored locally
- Third-party payment processor (Stripe/Square - future)
- PCI DSS compliance required

**Transaction Verification:**
- HTTPS only
- Server-side validation
- Idempotency keys for payment requests

### 8.4 Sensitive Data Handling

**Encrypted Fields:**
- API keys (environment variables only)
- Payment method details
- SSN/Government IDs (if collected)

**API Key Management:**
- OpenAI API key: environment variable only
- Never logged or stored in code
- Rotation on each deployment (recommended)

**Audit Logging:**
- Login/logout events
- Payment transactions
- Data modifications (admin)
- API errors and warnings

### 8.5 GDPR & Privacy

**Data Collection:**
- User consent required for data processing
- Privacy policy in app
- Right to data deletion (future)

**Data Retention:**
- Activity logs: 90 days (configurable)
- Transactions: 7 years (legal requirement)
- Conversations: 30 days unless kept by user

---

## 9. Testing Strategy

### 9.1 Testing Pyramid

```
         ┌─────────────────┐
         │   E2E Tests     │ ← 10%
         │  (Playwright,   │
         │   Detox)        │
         ├─────────────────┤
         │ Integration     │ ← 25%
         │ Tests           │
    ┌────┴─────────────────┴────┐
    │  Unit Tests               │ ← 65%
    │  (Jest)                   │
    └───────────────────────────┘
```

### 9.2 Unit Testing (Jest)

**Backend:**
- Service logic: 90%+ coverage
- Controllers: 80%+ coverage
- Utilities: 100% coverage
- Guards: 85%+ coverage

**Mobile:**
- Components: 80%+ coverage
- Hooks: 85%+ coverage
- Services: 90%+ coverage
- Context: 85%+ coverage

**Run Tests:**
```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

### 9.3 Integration Testing

**Backend API Testing:**
- SuperTest for HTTP testing
- Mock database (StoreService)
- Full endpoint validation
- Error case coverage

**Mobile API Integration:**
- Mock API responses
- Network error handling
- Auth token flow
- Data transformation

### 9.4 E2E Testing (Playwright + Detox)

**Playwright (Web):**
- Browsers: Chrome, Firefox, Safari
- Mobile viewports: iPhone 12, Pixel 5
- Scenarios: Auth, marketplace, checkout
- Responsiveness testing

**Detox (Native Mobile):**
- iOS simulator (iPhone 15)
- Android emulator (Pixel 4 API 31)
- Native navigation
- Gesture testing
- App lifecycle

**Run E2E Tests:**
```bash
# Playwright tests
npm run test:playwright

# Detox tests
npm run test:e2e

# All tests
npm run test:all
```

### 9.5 Test Coverage Targets

| Component | Target | Status |
|-----------|--------|--------|
| Backend services | 90% | In progress |
| Mobile components | 80% | In progress |
| API integration | 85% | In progress |
| Critical paths | 95% | In progress |

---

## 10. Deployment

### 10.1 Development Environment

**Backend Setup:**
```bash
cd backend
npm install
npm run start:dev          # Runs on :3001
```

**Mobile Setup:**
```bash
cd mobile
npm install
npm start                  # Expo server
# Scan QR code in Expo Go app
```

### 10.2 Production Deployment

**Backend (Docker):**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/src/main"]
```

**Deployment Platforms (Options):**
- Heroku: Simple, built-in SSL, automatic scaling
- AWS EC2/ECS: Full control, more expensive
- Railway: Git-based, similar to Heroku
- Render: Easier than AWS, good pricing

**Mobile Deployment:**
- **iOS**: TestFlight (beta) → App Store
- **Android**: Google Play Console beta → Production
- **Web**: Vercel/Netlify (future)

### 10.3 Environment Variables

**Backend (.env):**
```
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d
OPENAI_API_KEY=sk-...
CORS_ORIGIN=*
```

**Mobile (app.config.ts):**
```
API_URL=http://localhost:3001/api
```

### 10.4 CI/CD Pipeline (GitHub Actions)

```yaml
name: Testing & Deployment

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install & Test
        run: |
          npm install
          npm run test
          npm run test:cov
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Deploy backend
          # Deploy mobile
```

---

## 11. Development Setup

### 11.1 Prerequisites

- **Node.js**: 20.19.4+
- **npm/pnpm**: 9.0+
- **Git**: Latest
- **Xcode**: 14+ (for iOS simulator)
- **Android Studio**: Latest (for Android emulator)

### 11.2 Local Development

**1. Clone Repository:**
```bash
git clone https://github.com/yourusername/dyp-farms-coffee.git
cd dyp-farms-coffee
```

**2. Install Dependencies:**
```bash
# Using pnpm (recommended)
pnpm install

# Or npm
npm install
```

**3. Setup Environment:**
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your values

# Mobile
cd ../mobile
# app.config.ts is pre-configured
```

**4. Start Services:**
```bash
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2: Mobile
cd mobile
npm start

# Terminal 3: Run tests (optional)
npm run test:watch
```

**5. Access App:**
- Backend API: http://localhost:3001
- Mobile: Scan QR code in Expo Go app
- Web (future): http://localhost:3000

### 11.3 Git Workflow

**Branches:**
- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches

**Commit Convention:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: feat, fix, docs, style, refactor, test, chore

**Husky Hooks:**
- Pre-commit: ESLint, Prettier, type check
- Pre-push: Run tests

### 11.4 Code Quality

**ESLint:**
```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
```

**Prettier:**
```bash
npm run format        # Format code
npm run format:check  # Check formatting
```

**TypeScript:**
```bash
npm run type-check    # Type checking
```

---

## 12. Performance Considerations

### 12.1 Backend Performance

**API Response Times:**
- Typical: < 200ms
- Target: < 500ms
- Max acceptable: 1000ms

**Database Optimization (Future):**
- Indexing on frequently searched fields
- Query optimization with Prisma
- Connection pooling
- Caching layer (Redis)

**Memory Management:**
- Current in-memory store: ~10MB
- Production database: PostgreSQL with 100 connections

### 12.2 Mobile Performance

**App Size:**
- Target: < 100MB (iOS/Android)
- Current: ~60MB (Expo)
- Minification & tree-shaking enabled

**Startup Time:**
- Target: < 3 seconds
- Time to interactive: < 5 seconds
- Lazy loading screens enabled

**Memory Usage:**
- Target: < 200MB RAM
- Optimize images: JPEG 80% quality
- Remove unused dependencies

**Network Optimization:**
- API request batching
- Response caching
- Pagination (limit: 50 items)
- Image lazy loading

### 12.3 Monitoring & Analytics

**Error Tracking:**
- Implement Sentry (frontend/backend)
- Log levels: error, warning, info, debug
- Alert on critical errors

**Performance Monitoring:**
- API response times
- Mobile app crash rates
- User session tracking

---

## 13. Future Roadmap

### Phase 2: Enhanced Features
- **Blockchain Integration**: Lot authenticity verification via smart contracts
- **NFT Certificates**: Digital certificates for premium lots
- **Mobile Wallet**: In-app payment without external processor
- **Video Tours**: Farm video experiences instead of just bookings
- **Analytics Dashboard**: Business intelligence for farmers/roasters
- **Real-time Chat**: Live support chat (not just AI)

### Phase 3: Scale & Optimization
- **Web Application**: React/Next.js web interface
- **Multi-language**: i18n support (Spanish, Portuguese, Swahili)
- **Advanced Search**: Elasticsearch for lot search
- **Microservices**: Separate services for major features
- **GraphQL API**: Alternative to REST API
- **Push Notifications**: Real-time auction/order updates

### Phase 4: Enterprise Features
- **B2B Portal**: Wholesale ordering
- **Supply Chain Finance**: Securitized warehouse receipts
- **Sustainability Reporting**: ESG metrics and reporting
- **Integration APIs**: Third-party system connections
- **White-label Solution**: Branded platform for cooperatives
- **Advanced Compliance**: KYC/AML integrations

### Technology Debt & Improvements
1. **Database Migration**: Move to PostgreSQL with Prisma
2. **Payment Processing**: Stripe/Square integration
3. **File Storage**: AWS S3 for image uploads
4. **Email Service**: SendGrid for notifications
5. **SMS Gateway**: Twilio for SMS alerts
6. **Caching Layer**: Redis for session/data caching

---

## Appendix A: API Response Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | User lacks permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable | Validation failure |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Unexpected server error |
| 503 | Service Unavailable | Maintenance/downtime |

---

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| Lot | Individual batch of coffee beans |
| Grade | Quality classification (A+, A, B, C) |
| Cupping | Professional coffee tasting evaluation |
| Warehouse Receipt | Document certifying lot storage |
| Traceability | Path from farm to buyer |
| Carbon Footprint | Total greenhouse gas emissions |
| QR Code | Machine-readable verification code |
| Offset | Environmental project to neutralize emissions |
| Fintech | Financial technology integration |

---

## Document Information

**Author**: Technical Team  
**Created**: August 18, 2026  
**Last Updated**: August 18, 2026  
**Status**: Active Development  
**Version**: 1.0.0  

**Distribution**: Internal Team, Stakeholders  
**Confidentiality**: Internal Use Only  

---
