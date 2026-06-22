export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'farmer' | 'buyer';
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'received' | 'sent';
  amount: number;
  description: string;
  createdAt: string;
}

export interface CoffeeLot {
  id: string;
  lotNumber: string;
  name: string;
  origin: string;
  grade: string;
  price: number;
  cuppingNotes: string;
  traceability: string;
  warehouse: string;
  quantity: number;
  unit: string;
  imageUrl?: string;
  inAuction: boolean;
}

export interface AuctionBid {
  id: string;
  lotId: string;
  userId: string;
  bidderName: string;
  amount: number;
  createdAt: string;
}

export interface Auction {
  id: string;
  lotId: string;
  currentBid: number;
  endsAt: string;
  status: 'active' | 'ended';
  bids: AuctionBid[];
}

export interface ShipmentEvent {
  id: string;
  status: string;
  location: string;
  timestamp: string;
}

export interface Shipment {
  id: string;
  lotId: string;
  lotNumber: string;
  status: 'in_transit' | 'delivered' | 'pending';
  qrCode: string;
  events: ShipmentEvent[];
}

export interface QualityCheck {
  id: string;
  lotId: string;
  grade: string;
  points: number;
  scannedAt: string;
}

export interface Tour {
  id: string;
  title: string;
  description: string;
  type: 'tour' | 'accommodation' | 'tasting';
  price: number;
  duration: string;
  rating: number;
  reviewCount: number;
}

export interface Review {
  id: string;
  tourId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  userId: string;
  lotId: string;
  quantity: number;
}

export interface DashboardData {
  walletBalance: number;
  pendingPayments: number;
  auctionStatus: string;
  weatherInsights: {
    temperature: number;
    humidity: number;
    forecast: string;
  };
  warehouseLots: number;
}
