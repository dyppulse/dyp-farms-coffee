# Dyp Farms Coffee - Deployment Guide

**Version:** 1.0.0  
**Last Updated:** August 18, 2026

---

## Table of Contents

1. [Mobile App Deployment (Google Play Store)](#mobile-app-deployment)
2. [Backend Deployment (Free Hosting)](#backend-deployment)
3. [Environment Configuration](#environment-configuration)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Troubleshooting](#troubleshooting)

---

## Mobile App Deployment

### Prerequisites

- Google Play Developer Account ($25 one-time fee)
- Android device or emulator for testing
- Expo Account (free)
- EAS CLI installed

### Step 1: Set Up Google Play Developer Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Sign in with your Google account
3. Pay $25 registration fee
4. Complete developer profile
5. Accept agreements and policies

**Time Required:** ~15 minutes (pending verification)

### Step 2: Create App in Google Play Console

1. Click **Create App**
2. Fill in app details:
   - **App Name:** Dyp Farms Coffee
   - **Default Language:** English
   - **App/Game:** Select "App"
   - **Free/Paid:** Select "Free"
   - Accept policies
3. Click **Create App**

### Step 3: Complete App Store Listing

#### Content Rating
1. Go to **Content Rating**
2. Fill out questionnaire
3. Submit for rating (auto-assigned)

#### App Details
1. Go to **Store Listing**
2. Fill in:
   - **Short Description:** (80 characters)
     ```
     Dyp Farms Coffee - Connect farmers, roasters, and coffee lovers
     ```
   - **Full Description:** (4000 characters max)
     ```
     Dyp Farms Coffee connects coffee farmers, roasters, buyers, and 
     tourists in a transparent marketplace. Features include:
     
     - Quality Grading: AI-powered coffee bean assessment
     - Live Auctions: Real-time bidding on premium lots
     - Financing: Flexible loans up to 80% collateral
     - Subscriptions: 3-tier coffee delivery plans
     - Logistics: Real-time shipment tracking with QR codes
     - Carbon Footprint: Track and offset environmental impact
     - Tours: Authentic farm experiences and bookings
     - Wallet: Secure payment system
     - AI Assistant: 24/7 chatbot support
     ```
   - **Screenshots:** (min 2, max 8) - Create 5 screenshots showing:
     1. Login/Dashboard
     2. Marketplace browsing
     3. Auctions feature
     4. Quality scanning
     5. Carbon footprint tracking
   - **Feature Graphic:** 1024x500px
   - **Icon:** 512x512px (must be PNG)
   - **Category:** Shopping
   - **Contact Email:** your-email@example.com

3. Review and save

### Step 4: Build Signed APK/AAB

#### Option A: Using Expo EAS (Recommended)

**Install EAS CLI:**
```bash
npm install -g eas-cli
```

**Configure EAS:**
```bash
cd mobile
eas build:configure
```

**Build for Production:**
```bash
eas build --platform android --release
```

This creates a production-ready AAB (Android App Bundle).

**Output:** Download link provided after build completes (~15 minutes)

#### Option B: Manual Build (Advanced)

```bash
cd mobile

# Generate keystore (first time only)
keytool -genkey -v -keystore ~/my-upload-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias my-key-alias

# Build AAB
eas build --platform android --release
```

### Step 5: Submit to Google Play Store

1. Go to **Testing → Internal Testing**
2. Create new release
3. Click **Create new release**
4. Upload AAB file (from Step 4)
5. Review release details
6. Click **Save**
7. Add internal testers (your email)

**Test in Internal Track (1-2 hours):**
- Install on Android device
- Test all features
- Verify payments/wallet
- Test AI assistant
- Check quality scanner

### Step 6: Submit for Production Review

1. Go to **Production**
2. Click **Create new release**
3. Upload same AAB file
4. Fill in release notes:
   ```
   Version 1.0.0 - Initial Release
   
   Features:
   - Coffee marketplace and auctions
   - AI quality assessment
   - Real-time logistics tracking
   - Carbon footprint calculation
   - Wallet and payment system
   - Farm tour booking
   - Community forums
   - 24/7 AI assistant
   ```
5. Click **Save and Review**
6. Review app details (content rating, etc.)
7. Click **Submit for Review**

**Review Timeline:** 1-3 days (usually 24 hours)

### Step 7: Monitor Review Status

1. Go to **Release Dashboard**
2. Watch status updates:
   - **Pending:** Awaiting review
   - **In Review:** Under examination
   - **Approved:** Ready to publish
   - **Rejected:** See details, fix issues, resubmit

### Common Rejection Reasons & Fixes

| Reason | Fix |
|--------|-----|
| Crashes on startup | Test thoroughly on various devices |
| Permission issues | Ensure all permissions are necessary |
| Misleading description | Ensure description matches actual features |
| Poor quality graphics | Use high-res 1024x500 feature graphic |
| Broken links | Test all links in app |

### Step 8: Launch to Production

Once approved:
1. Go to **Release Dashboard**
2. Click **Review Release** under Production
3. Click **Start Rollout to Production**
4. Set rollout percentage:
   - Start at 10% (test with real users)
   - Increase to 25% if no critical issues
   - Increase to 50% after 12 hours
   - Full rollout (100%) after 24 hours

**Your app is now live on Google Play Store!** 🎉

---

## Backend Deployment

### Free Hosting Platform Options

| Platform | Free Tier | RAM | Uptime | Pros | Cons |
|----------|-----------|-----|--------|------|------|
| **Render** | Yes (500MB, auto-sleep) | 512MB | 99.9% | Easy Postgres integration | Sleeps after 15 min inactivity |
| **Railway** | $5/month (free trial) | 512MB | 99.9% | Simple deployment, good docs | Paid after trial |
| **Fly.io** | Yes | 3GB | 99.99% | Fastest, global, good free tier | Complex setup |
| **Replit** | Yes | 500MB | Variable | Quick prototyping | Limited for production |
| **Vercel** | Yes (functions) | 512MB | 99.9% | Serverless, fast | Node.js limited |

### Recommended: Render (Best Free Option)

**Advantages:**
- ✅ Truly free tier (sleeps if unused but wakes on request)
- ✅ Free PostgreSQL database
- ✅ Auto-deploys from GitHub
- ✅ Good documentation
- ✅ Easy to upgrade later

**Limitations:**
- ⚠️ Spins down after 15 minutes of inactivity (first request takes 30s)
- ⚠️ Limited to 100MB/month bandwidth

### Step 1: Prepare Repository for Deployment

**1. Create `.dockerignore` in backend:**
```
node_modules
npm-debug.log
.env.local
dist
.git
```

**2. Update `backend/package.json` scripts:**
```json
{
  "scripts": {
    "start": "node dist/src/main",
    "start:dev": "nest start --watch",
    "build": "nest build",
    "postinstall": "npm run build --prefix ../packages/payments || true"
  }
}
```

**3. Create `backend/.env.production`:**
```
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-key-change-this
OPENAI_API_KEY=sk-your-api-key
DATABASE_URL=postgresql://user:pass@host/dbname
CORS_ORIGIN=*
LOG_LEVEL=warn
```

**4. Commit changes:**
```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Step 2: Deploy to Render

#### 2.1 Create Render Account

1. Go to [Render.com](https://render.com)
2. Click **Sign up**
3. Connect GitHub account
4. Authorize Render access to your repositories

#### 2.2 Create PostgreSQL Database

1. Click **Dashboard**
2. Click **New +** → **PostgreSQL**
3. Fill in:
   - **Name:** `dyp-farms-db`
   - **Database:** `dyp_farms`
   - **User:** `postgres`
   - **Region:** Choose closest to users
   - **PostgreSQL Version:** 15
4. Click **Create Database**

**Wait for creation (~2 minutes)**

Copy the **Internal Database URL** - you'll need this for the backend.

#### 2.3 Create Web Service

1. Click **Dashboard**
2. Click **New +** → **Web Service**
3. Connect your GitHub repository:
   - Select `dyp-farms-coffee` repo
   - Branch: `main`
4. Fill in Service Details:
   - **Name:** `dyp-farms-api`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. Click **Create Web Service**

#### 2.4 Add Environment Variables

In Render dashboard for your service:
1. Click **Environment**
2. Add variables:
   ```
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=your-complex-secret-key-here
   OPENAI_API_KEY=sk-your-key
   DATABASE_URL=<paste from PostgreSQL>
   CORS_ORIGIN=*
   LOG_LEVEL=warn
   ```
3. Click **Save**

#### 2.5 Deploy

1. Service automatically redeploys when you push to main
2. Watch deployment logs
3. Once **Live** appears, your API is ready!

**Your backend URL:** `https://dyp-farms-api.onrender.com/api`

### Step 3: Update Mobile App API URL

**Update `mobile/app.config.ts`:**
```typescript
export default {
  expo: {
    extra: {
      apiUrl: 'https://dyp-farms-api.onrender.com/api'
    }
  }
}
```

**Rebuild and submit to Play Store:**
```bash
cd mobile
eas build --platform android --release
```

### Alternative: Fly.io (Better Performance)

If you want better performance:

#### 1. Install Fly CLI

```bash
# macOS
brew install flyctl

# Or download from https://fly.io/docs/hands-on/install/
```

#### 2. Create Fly Account

```bash
flyctl auth signup
```

#### 3. Initialize Fly App

```bash
cd backend
flyctl launch

# Follow prompts:
# - App name: dyp-farms-coffee-api
# - Region: Choose closest to users
# - Create Postgres: Yes
# - Redis: No
```

#### 4. Set Environment Variables

```bash
flyctl secrets set \
  NODE_ENV=production \
  JWT_SECRET=your-secret-key \
  OPENAI_API_KEY=sk-your-key \
  CORS_ORIGIN=*
```

#### 5. Deploy

```bash
flyctl deploy
```

**Your backend URL:** `https://dyp-farms-coffee-api.fly.dev/api`

---

## Environment Configuration

### Production Secrets

**Backend `.env` (NEVER commit):**
```
NODE_ENV=production
PORT=3001
JWT_SECRET=generate-with: openssl rand -base64 32
OPENAI_API_KEY=sk-from-openai-dashboard
DATABASE_URL=postgresql://user:pass@host/db
CORS_ORIGIN=https://your-frontend-domain
LOG_LEVEL=error
```

**Mobile API URL (in code):**
```typescript
// app.config.ts
{
  expo: {
    extra: {
      apiUrl: 'https://your-backend-domain.com/api'
    }
  }
}
```

### Database Setup (First Time)

If using fresh PostgreSQL:

```bash
# Render dashboard → PostgreSQL → connect psql
psql postgres://user:password@host:port/database

# Create tables (if using migrations)
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

---

## Post-Deployment Verification

### Backend Health Check

```bash
# Test API is alive
curl https://your-backend.onrender.com/api/dashboard

# Should return 401 (needs auth token) or error
# Not 404 or 502
```

### API Tests

```bash
# Test login
curl -X POST https://your-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer@dypfarms.com","password":"password123"}'

# Test AI assistant
curl -X POST https://your-backend.onrender.com/api/ai/chat/start \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Mobile App Testing

1. **Install from Play Store** (or internal testing)
2. **Test on multiple devices:**
   - Pixel 4 (common)
   - Samsung Galaxy (large screen)
   - iPhone SE (if iOS ready)
3. **Test features:**
   - Login/signup
   - View marketplace
   - Filter lots
   - View AI assistant
   - Check carbon footprint
   - Scan quality (mock)
4. **Monitor crashes:**
   - Watch Google Play Console > Crashes & ANRs
   - Check Render logs for backend errors

### Monitoring & Logs

**Render Backend Logs:**
1. Go to **Service Dashboard**
2. Click **Logs** tab
3. View real-time logs
4. Set up alerts (paid feature)

**Google Play Console:**
1. Go to **Monitoring > Crashes & ANRs**
2. Watch for crash spikes
3. View stack traces
4. Address critical issues immediately

---

## Troubleshooting

### Mobile App Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "Cannot reach API" | Wrong API URL | Update `app.config.ts`, rebuild, resubmit |
| App crashes on startup | Missing env variables | Check Play Console crashes tab |
| Login fails | Backend down | Check Render dashboard status |
| Images not loading | S3 not configured | Use placeholder URLs or implement S3 |
| Slow app | Backend slow/sleeping | Upgrade Render plan or switch to Fly.io |

### Backend Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| 502 Bad Gateway | Crash/timeout | Check Render logs |
| Database connection error | URL wrong or DB down | Verify `DATABASE_URL` env variable |
| Out of memory | Memory leak | Check logs for error patterns |
| Slow responses | Database queries slow | Add indexes, optimize queries |
| High CPU | Infinite loops/poorly scaled code | Profile and optimize |

### Common Errors

**"Unhandled exception: Cannot find module"**
- Solution: `npm install` in build step, check `package.json`

**"Cannot connect to PostgreSQL"**
- Solution: Verify `DATABASE_URL`, check whitelist IP in Render

**"CORS errors in mobile app"**
- Solution: Set `CORS_ORIGIN=*` or whitelist domain

**"App sleeps after inactivity" (Render)**
- Solution: Upgrade to paid plan or switch to Fly.io
- Workaround: Ping API every 10 minutes (workaround only)

---

## Cost Breakdown

### Current Setup (Free)

| Service | Cost | Usage |
|---------|------|-------|
| **Render Web Service** | Free | 100GB bandwidth/month |
| **Render PostgreSQL** | Free | 1GB storage |
| **Google Play Store** | $25 (one-time) | Unlimited apps |
| **Expo** | Free | Unlimited builds |
| **GitHub** | Free | Unlimited repos |
| **Total** | **$25** | Per month: $0 |

### Scaling (Optional Upgrades)

| Tier | Price | Includes |
|------|-------|----------|
| **Standard** | $7/month | No auto-sleep, 2GB RAM |
| **Pro** | $25/month | Dedicated CPU, faster |
| **Custom** | $100+ | Full managed service |

---

## Next Steps

1. **Create Google Play Developer Account** (pay $25)
2. **Set up Render PostgreSQL** (free, ~2 minutes)
3. **Deploy Backend to Render** (free, ~5 minutes)
4. **Update Mobile API URL**
5. **Build & Test APK**
6. **Submit to Google Play Store** (1-3 days review)
7. **Monitor & Optimize**

---

## Support & Resources

- **Render Docs:** https://render.com/docs
- **Fly.io Docs:** https://fly.io/docs/
- **Google Play Console Help:** https://support.google.com/googleplay
- **Expo Docs:** https://docs.expo.dev
- **NestJS Deployment:** https://docs.nestjs.com/deployment

---

## Deployment Checklist

- [ ] Google Play Developer Account created
- [ ] Backend environment variables set
- [ ] Database configured
- [ ] Backend deployed to Render/Fly.io
- [ ] Mobile app tested on multiple devices
- [ ] API URL updated in mobile app
- [ ] AAB built and signed
- [ ] Play Store listing completed
- [ ] Screenshots and graphics uploaded
- [ ] App submitted for review
- [ ] Review approved and launched
- [ ] Monitoring set up
- [ ] Team notified of live URLs

---

**Questions?** Check logs, reach out to Render/Fly.io support, or review the documentation links above.

**Congratulations on going live!** 🚀☕
