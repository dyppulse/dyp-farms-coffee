# 🚀 Dyp Farms Coffee - DEPLOY NOW Guide

**Your Email:** dyppulse@gmail.com  
**Status:** Ready to Deploy  
**Time to Live:** ~15 minutes (backend) + 1-3 days (Play Store review)

---

## IMMEDIATE ACTION ITEMS

### ✅ Step 1: Deploy Backend to Render (5 minutes)

**1. Go to https://render.com**

**2. Click "Sign up"**
- Use GitHub: Select "Continue with GitHub"
- Authorize Render access
- Done!

**3. Create PostgreSQL Database**
- Click **Dashboard** → **New +** → **PostgreSQL**
- Fill in:
  ```
  Name: dyp-farms-db
  Database: dyp_farms
  User: postgres
  Region: (pick closest to you)
  PostgreSQL Version: 15
  ```
- Click **Create Database**
- Wait 2-3 minutes...
- **Copy the Internal Database URL** (you'll need this!)

**4. Create Web Service**
- Click **Dashboard** → **New +** → **Web Service**
- **Connect GitHub** → Select `dyppulse/dyp-farms-coffee`
- Fill in:
  ```
  Name: dyp-farms-api
  Root Directory: backend
  Runtime: Node
  Build Command: npm install && npm run build
  Start Command: npm start
  Plan: Free
  ```
- Click **Create Web Service**

**5. Add Environment Variables**
- In the new service, click **Environment**
- Add these variables:
  ```
  NODE_ENV=production
  PORT=3001
  JWT_SECRET=<generate: openssl rand -base64 32>
  OPENAI_API_KEY=sk-<your-openai-key>
  DATABASE_URL=<paste from PostgreSQL>
  CORS_ORIGIN=*
  ```
- Click **Save**

**6. Wait for Deploy to Complete**
- Watch logs
- When you see **"Live"** → Backend is LIVE! ✅

**Your Backend URL:**
```
https://dyp-farms-api.onrender.com/api
```

Test it:
```bash
curl https://dyp-farms-api.onrender.com/api/dashboard
# Should return: {"message":"Unauthorized",...}
# That's correct! (means API is working)
```

---

### ✅ Step 2: Build Production APK (10 minutes)

**1. Install Expo EAS CLI:**
```bash
npm install -g eas-cli
```

**2. Update Mobile API URL:**

Edit `mobile/app.config.ts`:
```typescript
export default {
  expo: {
    extra: {
      apiUrl: 'https://dyp-farms-api.onrender.com/api'  // ← ADD THIS
    }
  }
}
```

**3. Login to Expo:**
```bash
eas login
# Use your email: dyppulse@gmail.com
# Set password
```

**4. Configure EAS (first time):**
```bash
cd mobile
eas build:configure
# Follow prompts, accept defaults
```

**5. Build Production APK:**
```bash
eas build --platform android --release
```

This will:
- Build optimized APK
- Sign it for Play Store
- Upload to Expo servers
- Take ~10-15 minutes

**When done:**
- You'll get a download link
- Save the `.aab` file (Android App Bundle)

---

### ✅ Step 3: Create Google Play Store App (10 minutes)

**1. Go to https://play.google.com/console**

**2. Pay $25 one-time registration:**
- Click "Sign up"
- Use email: dyppulse@gmail.com
- Complete payment ($25 USD)

**3. Create App:**
- Click **Create App**
- Fill in:
  ```
  App Name: Dyp Farms Coffee
  Default Language: English
  App/Game: App
  Free/Paid: Free
  ```
- Accept policies → **Create App**

**4. Complete Store Listing**

Go to **Store Listing** → Fill in:

**Short Description:**
```
Dyp Farms Coffee - Connect farmers, roasters & coffee lovers worldwide
```

**Full Description:**
```
Dyp Farms Coffee is a platform connecting coffee farmers, roasters, 
buyers, and tourists in a transparent marketplace.

KEY FEATURES:
🌾 Quality Grading - AI-powered coffee bean assessment
🏆 Live Auctions - Real-time bidding on premium coffee lots
💰 Financing - Flexible loans up to 80% of collateral value
📦 Subscriptions - 3-tier delivery plans (Starter, Enthusiast, Connoisseur)
🚚 Logistics - Real-time shipment tracking with QR verification
🌱 Carbon Footprint - Track & offset environmental impact
🗺️ Farm Tours - Book authentic coffee farm experiences
💳 Wallet - Secure payments & transaction management
🤖 AI Assistant - 24/7 intelligent chatbot support

COMMUNITY:
👥 Connect with coffee enthusiasts worldwide
💬 Join discussions and share experiences
🌍 Support sustainable coffee farming

Download now to transform how you buy, sell, and experience coffee!
```

**App Icon:** 512x512 PNG (use coffee/farm emoji-inspired design)

**Feature Graphic:** 1024x500px (banner image)

**Screenshots** (take 5):
1. Login screen
2. Marketplace browsing
3. Quality scanning
4. Carbon footprint
5. AI Assistant

Use phone screenshots or mockups

**Category:** Shopping  
**Content Rating:** Everyone

Click **Save**

**5. Set Content Rating:**
- Go to **Content Rating**
- Fill questionnaire (2 minutes)
- Submit → Auto-rated

---

### ✅ Step 4: Submit to Play Store (5 minutes)

**1. Go to Testing → Internal Testing**

**2. Click "Create new release"**

**3. Upload APK/AAB:**
- Upload the `.aab` file from Step 2
- Fill release notes:
```
Version 1.0.0 - Initial Launch

🚀 KEY FEATURES:
• AI-powered coffee quality grading
• Real-time auctions and bidding
• Environmental carbon tracking
• Farm tour bookings
• Secure wallet system
• 24/7 AI assistant

🌍 Connect with coffee farmers, roasters, and enthusiasts worldwide!
```

**4. Click "Save and Review"**

**5. Click "Start Internal Testing"**

Test on Android device (your phone):
- Install from Play Store → Internal Testing
- Test all features:
  - ✅ Login
  - ✅ Browse marketplace
  - ✅ View carbon footprint
  - ✅ Try AI assistant
  - ✅ Quality scan
  
Let it run 12 hours without issues → Ready for production!

---

### ✅ Step 5: Launch to Production (2 minutes)

**1. Go to Production release**

**2. Create new release**
- Upload same `.aab`
- Same release notes
- Click **Save and Review**

**3. Click "Submit for Review"**

**Play Store will review for 1-3 days (usually 24 hours)**

---

### ✅ Step 6: After Approval - Go Live (1 minute)

Once you get **"Approved"** notification:

**1. Go to Release Dashboard**

**2. Start Rollout:**
- Click **Review Release**
- Click **Start rollout to Production**
- Set **10%** rollout first
- Click **Update release**

**Wait 2 hours** - Monitor for crashes in Play Console

**Then scale up:**
- 10% → 25% (after 2 hours)
- 25% → 50% (after 4 hours)  
- 50% → 100% (after 8 hours)

**Your app is LIVE!** 🎉

---

## YOUR DEPLOYMENT CHECKLIST

### Today
- [ ] Deploy backend to Render
  - [ ] Create Render account
  - [ ] Create PostgreSQL database
  - [ ] Create Web Service
  - [ ] Add environment variables
  - [ ] Wait for "Live" status
  - [ ] Test API: curl command ✅

- [ ] Build APK
  - [ ] Update API URL in app.config.ts
  - [ ] Login to Expo
  - [ ] Run eas build
  - [ ] Download .aab file

### Tomorrow
- [ ] Create Google Play account ($25)
  - [ ] Pay registration fee
  - [ ] Create app
  - [ ] Upload app icon
  - [ ] Upload screenshots
  - [ ] Write store listing
  - [ ] Set content rating

- [ ] Internal Testing
  - [ ] Upload .aab to internal testing
  - [ ] Test on real Android device
  - [ ] Verify all features work
  - [ ] Check for crashes (12+ hours)

### This Week
- [ ] Submit to Production
  - [ ] Upload .aab to production
  - [ ] Submit for review
  - [ ] Wait 1-3 days for approval
  - [ ] Once approved, start rollout

- [ ] Monitor & Scale
  - [ ] 10% rollout → Monitor 2 hours
  - [ ] 25% rollout → Monitor 4 hours
  - [ ] 50% rollout → Monitor 8 hours
  - [ ] 100% rollout → FULLY LIVE! 🚀

---

## LIVE URLS AFTER DEPLOYMENT

**Backend API:**
```
https://dyp-farms-api.onrender.com/api
```

**Play Store:**
```
https://play.google.com/store/apps/details?id=com.dypfarms.coffee
```

**Dashboard:**
```
https://play.google.com/console → Dyp Farms Coffee
```

---

## IMPORTANT SECRETS

**Keep these safe:**
```
OPENAI_API_KEY=sk-...           (save in Render)
JWT_SECRET=...                  (generate new)
DATABASE_URL=postgresql://...   (from Render)
```

**Never commit to GitHub!**

---

## TROUBLESHOOTING

### Backend won't deploy
- Check logs in Render dashboard
- Verify environment variables are set
- Make sure DATABASE_URL is correct

### APK too large
- Normal: ~80-100MB
- Render auto-optimizes via EAS

### Play Store rejects app
- Check rejection reason in console
- Fix issue and resubmit
- Most common: wrong screenshots or description

### App crashes on launch
- Check Play Console → Crashes
- Check Render logs
- Verify API URL is correct

---

## SUPPORT

**Need help?**

1. Check Render logs: Dashboard → Service → Logs
2. Check Play Console: Crashes & ANRs
3. Check backend: `curl https://dyp-farms-api.onrender.com/api/dashboard`
4. Re-read DEPLOYMENT.md for detailed guide

---

## FINAL CHECKLIST BEFORE SUBMIT

Backend:
- [ ] Render PostgreSQL is running
- [ ] Web Service shows "Live"
- [ ] API responds to test request
- [ ] Environment variables are set

Mobile:
- [ ] API URL updated to Render URL
- [ ] APK built and downloaded
- [ ] Tested on real Android device
- [ ] No crashes after 12+ hours

Play Store:
- [ ] Account created ($25 paid)
- [ ] App created
- [ ] Screenshots uploaded
- [ ] Description written
- [ ] Content rating set

---

**YOU'RE READY! 🚀**

Follow the steps above in order, and your app will be LIVE within 2-5 days.

Good luck! ☕

---

**Questions?** → See DEPLOYMENT.md for detailed guide
**Issues?** → Check troubleshooting section above
**Need help?** → Run: `npm run start:dev` to test locally first
