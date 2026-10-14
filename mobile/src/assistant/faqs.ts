/**
 * All assistant content lives here. Edit this file to add or change questions.
 *
 * - `roles` omitted = shown to everyone.
 * - `keywords` are extra words/phrases users might type (multi-word phrases get a bonus).
 * - `action.path` is an Expo Router path; the answer shows a button to open it.
 * Keep steps short and use the exact button/tab names from the app.
 */
import type { FaqCategory, FaqEntry } from './types';

export const CATEGORIES: FaqCategory[] = [
  { id: 'start', title: 'Getting started', icon: 'rocket-outline' },
  { id: 'farm', title: 'Farms & harvest', icon: 'leaf-outline' },
  { id: 'weather', title: 'Weather & seasons', icon: 'partly-sunny-outline' },
  { id: 'finance', title: 'Finance', icon: 'cash-outline' },
  { id: 'wallet', title: 'Wallet & payments', icon: 'wallet-outline' },
  { id: 'market', title: 'Market & auctions', icon: 'bag-outline' },
  { id: 'tours', title: 'Tours & shop', icon: 'map-outline' },
  { id: 'orders', title: 'Orders & tracking', icon: 'navigate-outline' },
  { id: 'account', title: 'Account & support', icon: 'person-outline' },
];

/** Shown as the first suggestions. Entries not meant for the user's role are skipped. */
export const STARTER_IDS = [
  'what-can-app-do',
  'register-farm',
  'add-harvest',
  'check-weather',
  'request-finance',
  'wallet-add-funds',
  'join-auction',
  'book-tour',
  'track-shipment',
  'contact-support',
];

export const FAQS: FaqEntry[] = [
  // ───────────── Getting started ─────────────
  {
    id: 'what-can-app-do',
    category: 'start',
    question: 'What can I do in Dyp Farms Coffee?',
    keywords: ['features', 'overview', 'about', 'getting started', 'what is', 'tabs', 'menu', 'navigate'],
    answer:
      'Dyp Farms Coffee connects coffee farmers, roasters/buyers and visitors. The bottom tabs change with your role; your Home screen is the starting point and has shortcuts to everything else.',
    steps: [
      'Farmers: Home, Harvest, Wallet, Track, Profile. Register farms, grade harvests, check weather, request finance and follow shipments.',
      'Roasters: Home, Market, Orders, Wallet, Profile. Browse lots, join live auctions, buy and track orders.',
      'Tourists: Explore, Tours, Market, Wallet, Profile. Book farm tours and buy coffee from the shop.',
      'Everyone: the bell on Home opens Notifications, and Profile has Contact support.',
    ],
  },
  {
    id: 'switch-role',
    category: 'start',
    question: 'How do I switch between farmer, roaster and tourist?',
    keywords: ['change role', 'switch role', 'log out', 'logout', 'sign out', 'account type', 'different role'],
    answer: 'Your role is chosen when you sign in. To use another role, log out and pick it again.',
    steps: ['Open the Profile tab.', 'Scroll down and tap Switch Role / Log Out.', 'Confirm, then choose a role on the next screen.'],
    action: { label: 'Open Profile', path: '/(tabs)/profile' },
  },
  {
    id: 'notifications',
    category: 'start',
    question: 'Where do I see my notifications?',
    keywords: ['alerts', 'bell', 'messages', 'updates', 'notification'],
    answer: 'All alerts such as bids, payments, orders and shipments are collected in Notifications.',
    steps: ['On the Home screen, tap the bell icon at the top.', 'Or open Profile and tap Notifications under Preferences.'],
    action: { label: 'Open Notifications', path: '/notifications' },
  },

  // ───────────── Farms & harvest ─────────────
  {
    id: 'register-farm',
    category: 'farm',
    roles: ['farmer'],
    question: 'How do I register my farm and draw its boundary?',
    keywords: ['add farm', 'new farm', 'farm boundary', 'draw boundary', 'map', 'corners', 'area', 'acres', 'hectares', 'pin', 'location', 'satellite', 'plot'],
    answer:
      'Register each farm once with a name and its location. You can mark the exact boundary by placing 4 corners on the satellite map, and the app calculates the area for you.',
    steps: [
      'Open Profile and tap Farm / company details, then tap + Add Farm.',
      'Type a Farm name, for example North Plot.',
      'Choose Draw boundary (or Drop a pin if you only want a single location point).',
      'Pan and zoom the map until the crosshair sits exactly on the first corner, then tap + Add Point.',
      'Repeat for all 4 corners. Use Undo to remove the last point or Clear to start over.',
      'Check the area and perimeter shown. If you see "Intersecting lines", fix the order of the corners.',
      'Tap Save Farm.',
    ],
    tips: ['Allow location access so the map opens where you are standing.', 'Walk to each corner and place the points from there for the best accuracy.'],
    action: { label: 'Register a farm', path: '/farm-new' },
  },
  {
    id: 'manage-farms',
    category: 'farm',
    roles: ['farmer'],
    question: 'How do I view, add or remove my farms?',
    keywords: ['my farms', 'remove farm', 'delete farm', 'list farms', 'company details'],
    answer: 'Your Farms lists every farm you registered, with options to add or remove one.',
    steps: ['Open Profile, then Farm / company details.', 'Tap + Add Farm for a new one, or Remove next to a farm to delete it.'],
    action: { label: 'Open Your Farms', path: '/account-farms' },
  },
  {
    id: 'add-harvest',
    category: 'farm',
    roles: ['farmer'],
    question: 'How do I add a harvest and grade its quality?',
    keywords: ['harvest', 'new lot', 'add lot', 'grade', 'quality check', 'ai grade', 'scan', 'photo', 'variety', 'quantity', 'kg', 'beans', 'coffee lot'],
    answer:
      'The Harvest tab records a lot and grades it from a photo of your beans. The grade is then used on the warehouse receipt, in the marketplace and for finance.',
    steps: [
      'Open the Harvest tab (or tap Add Harvest on Home).',
      'Choose the Coffee Variety and enter the Quantity (kg).',
      'Tap the photo area and take or choose a clear picture of the beans.',
      'Tap Run AI Quality Check and wait for the AI Grade.',
      'Tap Generate Warehouse Receipt to record the lot, or Scan Another Lot to continue.',
    ],
    tips: ['Use daylight and a plain background for a more reliable grade.', 'Open Full Scanner for the detailed quality report.'],
    action: { label: 'Open Harvest', path: '/(tabs)/harvest' },
  },
  {
    id: 'warehouse-receipts',
    category: 'farm',
    roles: ['farmer'],
    question: 'What is a warehouse receipt and how do I share it?',
    keywords: ['receipt', 'receipts', 'storage', 'warehouse', 'download receipt', 'share receipt', 'pdf', 'lots in warehouse'],
    answer:
      'A warehouse receipt is proof that your graded coffee is stored. It shows quantity, grade, storage and estimated value, and can be used to apply for finance.',
    steps: [
      'Create one with Generate Warehouse Receipt after a quality check.',
      'Open Warehouse Receipts to see all of them.',
      'Tap Share to send a link, Download for a PDF, or Finance to borrow against it.',
    ],
    action: { label: 'Open receipts', path: '/receipts' },
  },
  {
    id: 'community',
    category: 'farm',
    question: 'How do I ask other farmers a question or post in the community?',
    keywords: ['community', 'post', 'forum', 'chat', 'discussion', 'share advice', 'tips'],
    answer: 'The Community screen lets you read posts, create your own and chat.',
    steps: ['Open Community.', 'Tap Create New Post, add a Title, Category and Content, then tap Post.'],
    action: { label: 'Open Community', path: '/community' },
  },

  // ───────────── Weather & seasons ─────────────
  {
    id: 'check-weather',
    category: 'weather',
    question: 'How do I check the weather and harvest seasons?',
    keywords: ['weather', 'forecast', 'rain', 'temperature', 'humidity', 'harvest season', 'seasons', 'when to harvest', 'climate', 'origin', 'country'],
    answer:
      'Weather & Insights shows the weather at your location and the typical harvest windows for coffee-growing countries worldwide, marked as active, upcoming or off-season.',
    steps: [
      'On the Home screen, tap the weather card (farmers see it right under the summary).',
      'Scroll to Harvest seasons worldwide. Tap a country to see its crop windows and months.',
    ],
    tips: ['Season windows are typical ranges, not forecasts. Always confirm with your local conditions.'],
    action: { label: 'Open Weather & Insights', path: '/weather' },
  },
  {
    id: 'harvest-risk',
    category: 'weather',
    question: 'How does the Harvest Risk Calculator work?',
    keywords: ['risk', 'calculator', 'check risk', 'frost', 'drought', 'mold', 'drying', 'humidity', 'rainfall'],
    answer: 'Enter the conditions you expect and the calculator tells you how risky it is to harvest or dry coffee then.',
    steps: [
      'Open Weather & Insights.',
      'In Harvest Risk Calculator, fill in Temp (°C), Humidity (%) and Rainfall (mm).',
      'Tap Check Risk and read the result.',
    ],
    action: { label: 'Open Weather & Insights', path: '/weather' },
  },

  // ───────────── Finance ─────────────
  {
    id: 'request-finance',
    category: 'finance',
    roles: ['farmer'],
    question: 'How do I request a loan or finance?',
    keywords: ['loan', 'finance', 'financing', 'borrow', 'credit', 'money advance', 'interest', 'repayment', 'monthly payment', 'apply'],
    answer: 'You borrow against the value of a warehouse receipt. See the offer first, then request it if you are happy with the terms.',
    steps: [
      'Open Warehouse Receipts and tap Finance on the receipt you want to use (or open Financing directly).',
      'Under Calculate Your Loan Offer, check the receipt value and enter the amount you want.',
      'Review the interest rate, processing fee, monthly payment and total repayment in Your Loan Offer.',
      'Tap Proceed to Request, check the Loan Summary, then tap Request Loan.',
      'Follow the status of your request under your loan requests on the same screen.',
    ],
    tips: ['You need a warehouse receipt first. Grade a harvest on the Harvest tab to create one.'],
    action: { label: 'Open Financing', path: '/financing' },
  },
  {
    id: 'loan-status',
    category: 'finance',
    roles: ['farmer'],
    question: 'Where can I see my loan requests?',
    keywords: ['loan status', 'loan requests', 'approved', 'pending loan', 'rejected'],
    answer: 'Your previous requests and their status are listed at the bottom of the Financing screen.',
    action: { label: 'Open Financing', path: '/financing' },
  },

  // ───────────── Wallet & payments ─────────────
  {
    id: 'wallet-add-funds',
    category: 'wallet',
    question: 'How do I add money to my wallet?',
    keywords: ['top up', 'deposit', 'add funds', 'add money', 'fund wallet', 'balance', 'ugx', 'digital wallet'],
    answer: 'Your wallet holds your balance in UGX for payments and payouts.',
    steps: ['Open the Wallet tab.', 'Enter the amount (UGX) in the box.', 'Tap Add. A confirmation appears and your balance updates.'],
    action: { label: 'Open Wallet', path: '/(tabs)/wallet' },
  },
  {
    id: 'wallet-withdraw',
    category: 'wallet',
    question: 'How do I withdraw money from my wallet?',
    keywords: ['withdraw', 'cash out', 'payout', 'send to mobile money', 'get my money'],
    answer: 'You can withdraw any amount up to your wallet balance.',
    steps: ['Open the Wallet tab.', 'Enter the amount (UGX).', 'Tap Withdraw.'],
    tips: ['Send and Split are not available yet.'],
    action: { label: 'Open Wallet', path: '/(tabs)/wallet' },
  },
  {
    id: 'wallet-history',
    category: 'wallet',
    question: 'Where is my transaction history?',
    keywords: ['transactions', 'history', 'statement', 'payments made', 'past payments'],
    answer: 'Every deposit, withdrawal and payment is listed under Transaction History at the bottom of the Wallet tab.',
    action: { label: 'Open Wallet', path: '/(tabs)/wallet' },
  },
  {
    id: 'mobile-money',
    category: 'wallet',
    question: 'How do I pay with MTN Mobile Money or Airtel Money?',
    keywords: ['mobile money', 'momo', 'mtn', 'airtel', 'pay', 'payment', 'pin', 'checkout', 'phone number', 'payment failed'],
    answer: 'When you pay for a tour or a shop order you choose a mobile money provider, and approve the payment on your phone.',
    steps: [
      'At the payment screen, choose MTN Mobile Money or Airtel Money.',
      'Enter the Mobile money number that will pay.',
      'Confirm. You will get a prompt on your phone; enter your PIN to approve.',
    ],
    tips: ['If the payment fails, check the number and your balance, then try again. Contact support if money left your account.'],
  },

  // ───────────── Market & auctions ─────────────
  {
    id: 'browse-lots',
    category: 'market',
    roles: ['roaster', 'tourist'],
    question: 'How do I browse and buy coffee lots?',
    keywords: ['marketplace', 'market', 'buy', 'lots', 'purchase', 'buy now', 'add to cart', 'cart', 'order', 'search', 'filter'],
    answer: 'The Market tab lists coffee lots from farmers. You can buy at a fixed price or put lots in your cart.',
    steps: [
      'Open the Market tab and choose Browse Lots.',
      'Use the filters and tap a lot to see its grade, quantity and price.',
      'Tap Buy Now, or Add to Cart and open your cart to check out.',
      'Pay from your wallet or with mobile money. Your order then appears under Orders.',
    ],
    action: { label: 'Open Market', path: '/(tabs)/marketplace' },
  },
  {
    id: 'join-auction',
    category: 'market',
    question: 'How do I join an auction and place a bid?',
    keywords: ['auction', 'bid', 'bidding', 'live auction', 'join auction', 'highest bid', 'auto bid', 'autobid', 'countdown', 'win'],
    answer: 'Live auctions run on a countdown. The highest bid when the timer ends wins the lot.',
    steps: [
      'Open the Market tab and choose Live Auctions (or tap the live lot on Home).',
      'Tap Join Auction on a lot to enter the Auction Room.',
      'Check the Current highest bid and the countdown.',
      'Type Your bid, higher than the current one, and place it.',
      'Optional: turn on Auto-Bid so the app keeps bidding for you.',
      'Watch the Bid History. If you win, the order shows under Orders.',
    ],
    tips: ['Keep enough wallet balance to pay if you win.'],
    action: { label: 'Open Market', path: '/(tabs)/marketplace' },
  },
  {
    id: 'sell-auction-farmer',
    category: 'market',
    roles: ['farmer'],
    question: 'How do I sell my coffee or see my auction status?',
    keywords: ['sell', 'selling', 'auction status', 'list lot', 'put on auction', 'buyers', 'price'],
    answer: 'Once a lot is graded and stored it can be offered to buyers. Your Home screen shows lots in the warehouse, pending payments and the status of active auctions.',
    steps: ['Grade the harvest on the Harvest tab and generate its warehouse receipt.', 'Watch Home for Active Auctions and Pending Payments.', 'When a buyer pays, the money lands in your Wallet.'],
    action: { label: 'Open Harvest', path: '/(tabs)/harvest' },
  },

  // ───────────── Tours & shop ─────────────
  {
    id: 'book-tour',
    category: 'tours',
    roles: ['tourist', 'roaster'],
    question: 'How do I book a farm tour?',
    keywords: ['tour', 'tours', 'book', 'booking', 'visit', 'experience', 'tasting', 'stay', 'guests', 'time slot', 'meet the farmer'],
    answer: 'The Tours tab lists farm tours, stays and tastings you can book and pay for in the app.',
    steps: [
      'Open the Tours tab (called Explore on Home for tourists) and tap a tour.',
      'Read the details, then tap to book.',
      'Select a time slot and enter the Number of guests.',
      'Tap Continue to payment, choose MTN Mobile Money or Airtel Money, enter your number and approve on your phone.',
      'Your booking confirmation appears, and you can come back to it from the booking screen.',
    ],
    action: { label: 'Open Tours', path: '/(tabs)/tours' },
  },
  {
    id: 'shop-order',
    category: 'tours',
    question: 'How do I buy coffee from the shop?',
    keywords: ['shop', 'bag', 'gift', 'diaspora', 'wholesale', 'b2b', 'take home', 'bag', 'checkout', 'deliver', 'products'],
    answer: 'The shop sells roasted coffee as take-home, diaspora gifts or wholesale (B2B).',
    steps: [
      'Open the shop (from Tours or Market, look for Take the coffee home or the wholesale banner).',
      'Pick a category: All, Diaspora gifts, Tour take-home or Wholesale (B2B).',
      'Add products to your bag, then tap the bag bar at the bottom.',
      'Review the bag and pay with mobile money. Approve the prompt on your phone.',
    ],
    action: { label: 'Open shop', path: '/shop' },
  },
  {
    id: 'subscriptions',
    category: 'tours',
    question: 'How do coffee subscriptions work and how do I pause or skip?',
    keywords: ['subscription', 'subscribe', 'plan', 'recurring', 'monthly', 'delivery frequency', 'pause', 'skip', 'next delivery', 'cancel'],
    answer: 'A subscription delivers coffee on a schedule. You can change how often, pause it or skip one delivery.',
    steps: [
      'Open Coffee Subscriptions and tap View Plans.',
      'Choose a plan and tap Select Plan.',
      'Under Delivery Settings, set the Delivery Frequency.',
      'Use Skip Next Delivery or Pause Subscription any time. You can see the Next Delivery and Next Payment dates on the same screen.',
    ],
    action: { label: 'Open subscriptions', path: '/subscriptions' },
  },

  // ───────────── Orders & tracking ─────────────
  {
    id: 'track-shipment',
    category: 'orders',
    question: 'How do I track a shipment or delivery?',
    keywords: ['track', 'tracking', 'logistics', 'shipment', 'delivery', 'where is my', 'timeline', 'transport', 'shipping'],
    answer: 'Follow your coffee from farm to buyer on a timeline that updates at each stage.',
    steps: [
      'Farmers: open the Track tab. Roasters: open Orders and pick an active order.',
      'Tap a shipment, or View timeline, to see each stage.',
      'You also get a notification when the status changes.',
    ],
    action: { label: 'Open shipments', path: '/logistics' },
  },
  {
    id: 'my-orders',
    category: 'orders',
    roles: ['roaster'],
    question: 'Where do I see my orders?',
    keywords: ['orders', 'my orders', 'active orders', 'completed', 'pending checkout', 'delivered', 'purchase history'],
    answer: 'The Orders tab lists Active orders and Completed ones. Unpaid items show as Pending checkout.',
    steps: ['Open the Orders tab.', 'Switch between Active and Completed.', 'Tap an order to follow its shipment.'],
    action: { label: 'Open Orders', path: '/(tabs)/orders' },
  },

  // ───────────── Account & support ─────────────
  {
    id: 'edit-profile',
    category: 'account',
    question: 'How do I change my name or personal details?',
    keywords: ['profile', 'personal info', 'name', 'email', 'account id', 'details', 'update'],
    answer: 'Your profile details are under Personal info.',
    steps: ['Open the Profile tab.', 'Tap Personal info under Account.'],
    action: { label: 'Open Personal info', path: '/account' },
  },
  {
    id: 'biometrics',
    category: 'account',
    question: 'How do I turn on fingerprint or face sign-in?',
    keywords: ['biometrics', 'fingerprint', 'face id', 'touch id', 'faster login', 'security', 'unlock'],
    answer: 'Biometrics lets you sign in with your fingerprint or face instead of typing your password.',
    steps: [
      'Open the Profile tab and tap Biometrics under Security.',
      'Enter your account password and tap Enable.',
      'To switch it off later, tap Biometrics again and choose Disable.',
    ],
    tips: ['Your phone must already have a fingerprint or face set up.'],
    action: { label: 'Open Profile', path: '/(tabs)/profile' },
  },
  {
    id: 'contact-support',
    category: 'account',
    question: 'How do I contact support or report a problem?',
    keywords: ['support', 'help', 'issue', 'problem', 'complaint', 'ticket', 'contact', 'human', 'agent', 'report', 'bug', 'refund', 'not working', 'payout delay'],
    answer: 'Send us a support ticket and we will reply to you. You can follow all your tickets in the same place.',
    steps: [
      'Open Profile and tap Contact support.',
      'Under File a new issue, type a Subject and the Details of what happened.',
      'Tap Submit. Your ticket appears under Your tickets.',
    ],
    tips: ['Include the amount, date and the order or lot involved to get help faster.'],
    action: { label: 'Contact support', path: '/support' },
  },
];
