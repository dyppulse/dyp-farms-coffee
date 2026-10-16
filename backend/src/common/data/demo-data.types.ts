// Shape of backend/prisma/demo/demo-data.json (written by prisma/demo/generate.ts, loaded by
// the demo seeder). Times are relative ("daysAgo", "hoursLeft") so the data looks current
// whenever it is seeded.

export const DEMO_EMAIL_DOMAIN = 'demo.dypfarms.test';
export const DEMO_ID_PREFIX = 'demo-';

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: 'farmer' | 'roaster' | 'tourist';
  passwordHash: string;
  district?: string;
}

export interface DemoFarm {
  id: string;
  ownerId: string;
  name: string;
  sizeHectares: number;
  boundary: { lat: number; lng: number }[];
  daysAgo: number;
}

export interface DemoLot {
  id: string;
  name: string;
  origin: string;
  grade: string;
  price: number;
  cuppingNotes: string;
  traceability: string;
  warehouse: string;
  quantity: number;
  unit: 'kg';
  farmerId: string;
  farmId: string;
  inAuction: boolean;
  daysAgo: number;
}

export interface DemoBid {
  id: string;
  userId: string;
  bidderName: string;
  amount: number;
  minutesAgo: number;
}

export interface DemoAuction {
  id: string;
  lotId: string;
  status: 'active' | 'ended';
  /** Active auctions: hours until they close, counted from seeding time. */
  hoursLeft: number;
  /** Ended auctions: how long ago they closed. */
  endedDaysAgo: number;
  /** Evergreen auctions are pushed forward again on every seed run so they stay open for testing. */
  evergreen: boolean;
  currentBid: number;
  bids: DemoBid[];
  autoBids: { userId: string; bidderName: string; maxAmount: number }[];
}

export interface DemoReceipt {
  id: string;
  userId: string;
  lotId: string;
  lotName: string;
  variety: string;
  quantity: number;
  unit: 'kg';
  grade: string;
  moistureLevel: number;
  storageLocation: string;
  gpsLocation: { lat: number; lng: number };
  qualityScore: number;
  estimatedValue: number;
  daysAgo: number;
}

export interface DemoFinancing {
  id: string;
  userId: string;
  lotId: string;
  receiptId: string;
  requestedAmount: number;
  interestRate: number;
  duration: number;
  status: 'pending' | 'approved' | 'rejected' | 'funded';
  monthlyPayment: number;
  totalRepayment: number;
  dueDaysAhead: number;
  daysAgo: number;
}

export interface DemoPost {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  title: string;
  content: string;
  category: 'discussion' | 'tips' | 'news' | 'question';
  likeUserIds: string[];
  daysAgo: number;
  replies: { id: string; userId: string; userName: string; content: string; hoursAfter: number }[];
}

export interface DemoSubscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: 'active' | 'paused' | 'cancelled';
  frequency: 'weekly' | 'biweekly' | 'monthly';
  nextDeliveryDaysAhead: number;
  totalSpent: number;
  bagsSent: number;
  daysAgo: number;
}

export interface DemoTicket {
  id: string;
  userId: string;
  subject: string;
  body: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  team: 'payments' | 'logistics' | 'quality' | 'agronomy' | 'engineering' | null;
  daysAgo: number;
  comments: {
    id: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    body: string;
    internal: boolean;
    hoursAfter: number;
  }[];
}

export interface DemoNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  entityType: string;
  entityId: string;
  read: boolean;
  minutesAgo: number;
}

export interface DemoData {
  meta: { seed: number; counts: Record<string, number> };
  users: DemoUser[];
  farms: DemoFarm[];
  lots: DemoLot[];
  auctions: DemoAuction[];
  receipts: DemoReceipt[];
  financing: DemoFinancing[];
  posts: DemoPost[];
  subscriptions: DemoSubscription[];
  tickets: DemoTicket[];
  notifications: DemoNotification[];
}
