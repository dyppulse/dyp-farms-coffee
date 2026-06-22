import {
  Auction,
  CoffeeLot,
  Review,
  Shipment,
  Tour,
  User,
  WalletTransaction,
} from '../interfaces';

export const users: User[] = [
  {
    id: 'user-1',
    email: 'farmer@dypfarms.com',
    password: 'password123',
    name: 'Dyp Farmer',
    role: 'farmer',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-2',
    email: 'buyer@dypfarms.com',
    password: 'password123',
    name: 'John Buyer',
    role: 'buyer',
    createdAt: new Date().toISOString(),
  },
];

export const walletBalances: Record<string, number> = {
  'user-1': 12450,
  'user-2': 4520.75,
};

export const walletTransactions: WalletTransaction[] = [
  {
    id: 'tx-1',
    userId: 'user-2',
    type: 'sent',
    amount: -120,
    description: 'Sent to John',
    createdAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'tx-2',
    userId: 'user-2',
    type: 'payment',
    amount: -4520.75,
    description: 'Particle is Market',
    createdAt: '2026-06-02T14:30:00Z',
  },
  {
    id: 'tx-3',
    userId: 'user-2',
    type: 'received',
    amount: 500,
    description: 'Received from Market',
    createdAt: '2026-06-03T09:15:00Z',
  },
  {
    id: 'tx-4',
    userId: 'user-2',
    type: 'withdrawal',
    amount: -500,
    description: 'Withdraw to Bank',
    createdAt: '2026-06-04T16:00:00Z',
  },
  {
    id: 'tx-5',
    userId: 'user-2',
    type: 'deposit',
    amount: 300,
    description: 'Add Funds',
    createdAt: '2026-06-05T11:45:00Z',
  },
];

export const coffeeLots: CoffeeLot[] = [
  {
    id: 'lot-1',
    lotNumber: '1234',
    name: 'Papaya Natural',
    origin: 'Ethiopia, Yirgacheffe',
    grade: 'Grade A',
    price: 8.5,
    cuppingNotes: 'Floral, citrus, bergamot, honey sweetness',
    traceability: 'Farm A, Dyp Farms Estate',
    warehouse: 'b1a',
    quantity: 500,
    unit: 'kg',
    inAuction: true,
  },
  {
    id: 'lot-2',
    lotNumber: '1235',
    name: 'Kele Bars',
    origin: 'Kenya, Nyeri',
    grade: 'Grade A+',
    price: 12.0,
    cuppingNotes: 'Blackcurrant, tomato, bright acidity',
    traceability: 'Farm B, Dyp Farms Cooperative',
    warehouse: 'b1a',
    quantity: 300,
    unit: 'kg',
    inAuction: false,
  },
  {
    id: 'lot-3',
    lotNumber: '1236',
    name: 'Grieta Beyond',
    origin: 'Colombia, Huila',
    grade: 'Grade B',
    price: 6.75,
    cuppingNotes: 'Chocolate, caramel, nutty finish',
    traceability: 'Farm C, Dyp Farms Estate',
    warehouse: 'b2',
    quantity: 750,
    unit: 'kg',
    inAuction: true,
  },
  {
    id: 'lot-4',
    lotNumber: '1237',
    name: 'Sunrise Blend',
    origin: 'Guatemala, Antigua',
    grade: 'Grade A',
    price: 9.25,
    cuppingNotes: 'Smoky, spice, dark chocolate',
    traceability: 'Farm D, Dyp Farms Estate',
    warehouse: 'b1a',
    quantity: 400,
    unit: 'kg',
    inAuction: false,
  },
];

export const auctions: Auction[] = [
  {
    id: 'auction-1',
    lotId: 'lot-1',
    currentBid: 5200,
    endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    bids: [
      {
        id: 'bid-1',
        lotId: 'lot-1',
        userId: 'user-2',
        bidderName: 'Bensito Bame. J',
        amount: 5200,
        createdAt: '2026-06-09T10:00:00Z',
      },
      {
        id: 'bid-2',
        lotId: 'lot-1',
        userId: 'user-3',
        bidderName: 'Ives Stopheslages',
        amount: 5100,
        createdAt: '2026-06-09T09:55:00Z',
      },
      {
        id: 'bid-3',
        lotId: 'lot-1',
        userId: 'user-4',
        bidderName: 'Bensito Bame. J',
        amount: 5000,
        createdAt: '2026-06-09T09:50:00Z',
      },
    ],
  },
  {
    id: 'auction-2',
    lotId: 'lot-3',
    currentBid: 3800,
    endsAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    bids: [],
  },
];

export const shipments: Shipment[] = [
  {
    id: 'ship-1',
    lotId: 'lot-1',
    lotNumber: '1234',
    status: 'in_transit',
    qrCode: 'DYP-LOT-1234-VERIFY',
    events: [
      {
        id: 'evt-1',
        status: 'Picked up from farm',
        location: 'Dyp Farms Estate',
        timestamp: '2026-06-07T09:47:00Z',
      },
      {
        id: 'evt-2',
        status: 'Arrived at warehouse',
        location: 'Warehouse b1a',
        timestamp: '2026-06-07T15:47:00Z',
      },
      {
        id: 'evt-3',
        status: 'In transit to port',
        location: 'Mombasa Port',
        timestamp: '2026-06-08T10:50:00Z',
      },
      {
        id: 'evt-4',
        status: 'In transit',
        location: 'International shipping',
        timestamp: '2026-06-09T07:10:00Z',
      },
    ],
  },
];

export const tours: Tour[] = [
  {
    id: 'tour-1',
    title: 'Farm Tour & Harvest Experience',
    description:
      'Walk through our lush coffee estates, meet the farmers, and participate in a live harvest session.',
    type: 'tour',
    price: 85,
    duration: '4 hours',
    rating: 4.8,
    reviewCount: 24,
  },
  {
    id: 'tour-2',
    title: 'Farm Accommodations',
    description:
      'Stay overnight in our eco-lodge nestled among the coffee trees. Includes breakfast and cupping session.',
    type: 'accommodation',
    price: 150,
    duration: '1 night',
    rating: 4.9,
    reviewCount: 18,
  },
  {
    id: 'tour-3',
    title: 'Premium Tasting Session',
    description:
      'Guided cupping of our finest lots with our head roaster. Learn to identify flavor profiles and grades.',
    type: 'tasting',
    price: 45,
    duration: '2 hours',
    rating: 4.7,
    reviewCount: 31,
  },
];

export const reviews: Review[] = [
  {
    id: 'rev-1',
    tourId: 'tour-1',
    userName: 'Sarah M.',
    rating: 5,
    comment: 'An incredible experience! The farmers were so welcoming.',
    createdAt: '2026-05-20T12:00:00Z',
  },
  {
    id: 'rev-2',
    tourId: 'tour-1',
    userName: 'James K.',
    rating: 4,
    comment: 'Great tour, learned a lot about specialty coffee production.',
    createdAt: '2026-05-15T09:30:00Z',
  },
  {
    id: 'rev-3',
    tourId: 'tour-3',
    userName: 'Elena R.',
    rating: 5,
    comment: 'Best cupping session I have ever attended.',
    createdAt: '2026-05-10T16:00:00Z',
  },
];

export const cartItems: {
  id: string;
  userId: string;
  lotId: string;
  quantity: number;
}[] = [];
