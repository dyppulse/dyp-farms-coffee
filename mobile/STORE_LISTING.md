# Google Play listing: Dyp Farms Coffee

Copy-paste material for the Play Console. Facts below come from what the app does today.
Screenshots, the feature graphic and the Play Console answers still need a person.

## Store listing

- **App name (30 max):** Dyp Farms Coffee
- **Short description (80 max):** Buy, sell and bid on Ugandan coffee. Book farm tours. Pay with mobile money.
- **Category:** Business (alternative: Food & Drink)
- **Contact email:** dyppulse@gmail.com
- **Privacy policy URL:** https://<your-web-domain>/privacy
- **Account deletion URL (Data safety form):** https://<your-web-domain>/delete-account

### Full description

Dyp Farms Coffee connects Ugandan coffee farmers, buyers and visitors in one app.

**Farmers**
- Register your farm and draw its boundary on the map
- Grade your beans from a photo and get a warehouse receipt
- Track shipments with QR verification
- Check local weather and harvest seasons
- Explore financing against your receipts

**Buyers**
- Browse coffee lots by origin and grade
- Bid in live auctions, with auto-bid
- Shop for coffee and supplies
- Subscribe to regular deliveries

**Visitors**
- Browse farm tours, pick a time slot and book
- Pay with MTN Mobile Money or Airtel Money
- Get a ticket in the app and by email

**For everyone**
- Wallet in Uganda shillings with full transaction history
- Sign in with Face ID or fingerprint
- Community posts and support in the app
- Delete your account from the Profile screen at any time

## Data safety form: answers matching the app

| Data type | Collected | Shared | Purpose | Optional |
|---|---|---|---|---|
| Name | Yes | No | Account, app functionality | No |
| Email address | Yes | No | Account, communications | No |
| Phone number (mobile money) | Yes | Yes, with payment providers | Payments | No, only to pay |
| Precise location | Yes, while app is open | No | Farm boundary mapping | Yes |
| Photos | Yes | No | Coffee bean grading | Yes |
| Purchase history and payment info | Yes | Yes, with payment providers | Payments, receipts | No |
| Messages (support tickets, community) | Yes | No | App functionality | Yes |

- Data encrypted in transit: **Yes**
- Users can request deletion: **Yes**, in app and at the deletion URL above
- Passwords are stored hashed. Biometrics never leave the device.
- Check with the maintainer: Google Maps receives IP address and viewed map area.

## Content rating (IARC questionnaire)

No violence, sexual content, gambling, user-to-user purchasing of restricted goods or
mature themes. Users can interact (community posts) and make real-money purchases.
Expected rating: Everyone. The auctions are for coffee lots, not gambling.

## Target audience

18 and over (the terms require it for buying, selling, bidding and paying).

## Assets to prepare

- [ ] Hi-res icon 512 × 512 PNG (export from `assets/icon.png`)
- [ ] Feature graphic 1024 × 500 PNG
- [ ] At least 4 phone screenshots: Dashboard, Marketplace, Auction, Tours, Wallet, Farm map
- [ ] Production build: `eas build --platform android --profile production`
- [ ] Internal testing, then closed testing (Google requires 12 testers for 14 days for new personal developer accounts)

## Before submitting

- [ ] Web app deployed with `/privacy`, `/terms`, `/delete-account` reachable without sign-in
- [ ] Migrations applied to Neon: `npx prisma migrate deploy` in `backend/`
- [ ] MTN MoMo and Airtel credentials set in Render, sandbox payment tested end to end
- [ ] `GOOGLE_MAPS_API_KEY` set for the EAS build
- [ ] Privacy policy and terms read by someone qualified
