import Constants from 'expo-constants';

const API_PORT = 3001;

function getDevMachineHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost;

  if (!hostUri) return null;

  const withoutScheme = hostUri.replace(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//, '');
  const host = withoutScheme.split(':')[0];
  return host || null;
}

function resolveApiUrl(): string {
  const configured = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  const isLocalhost =
    !configured ||
    configured.includes('localhost') ||
    configured.includes('127.0.0.1');

  if (__DEV__ && isLocalhost) {
    const devHost = getDevMachineHost();
    if (devHost) {
      return `http://${devHost}:${API_PORT}/api`;
    }
  }

  return configured ?? `http://localhost:${API_PORT}/api`;
}

const API_URL = resolveApiUrl();

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      __DEV__
        ? `Cannot reach API at ${API_URL}. Is the backend running?`
        : 'Network error. Check your connection and try again.',
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ accessToken: string; user: { id: string; email: string; name: string; role: string } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      ),
    signup: (data: { email: string; password: string; name: string; role?: string }) =>
      request<{ accessToken: string; user: { id: string; email: string; name: string; role: string } }>(
        '/auth/signup',
        { method: 'POST', body: JSON.stringify(data) },
      ),
  },
  dashboard: {
    get: () => request<{
      walletBalance: number;
      pendingPayments: number;
      auctionStatus: string;
      weatherInsights: { temperature: number; humidity: number; forecast: string };
      warehouseLots: number;
    }>('/dashboard'),
  },
  tours: {
    list: () => request<Tour[]>('/tours'),
    get: (id: string) => request<Tour>(`/tours/${id}`),
    slots: (id: string, from?: string, to?: string) => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const qs = params.toString();
      return request<TourSlot[]>(`/tours/${id}/slots${qs ? `?${qs}` : ''}`);
    },
    reviews: (tourId?: string) =>
      request<Review[]>(`/tours/reviews${tourId ? `?tourId=${tourId}` : ''}`),
  },
  bookings: {
    list: () => request<Booking[]>('/bookings'),
    get: (id: string) => request<Booking>(`/bookings/${id}`),
    poll: (id: string) =>
      request<Booking>(`/bookings/${id}/poll`, { method: 'POST' }),
    ticket: (id: string) => request<TicketPayload>(`/bookings/${id}/ticket`),
    create: (
      tourId: string,
      data: {
        slotId: string;
        guests: number;
        paymentMethod: 'mtn_momo' | 'airtel_money';
        phoneNumber: string;
      },
    ) =>
      request<CreateBookingResult>(`/tours/${tourId}/bookings`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  wallet: {
    get: () => request<{ balance: number; transactions: Transaction[] }>('/wallet'),
    paymentMethods: () =>
      request<{ methods: ('mtn_momo' | 'airtel_money')[] }>('/wallet/payment-methods'),
    addFunds: (amount: number) =>
      request('/wallet/add-funds', { method: 'POST', body: JSON.stringify({ amount }) }),
    withdraw: (amount: number) =>
      request('/wallet/withdraw', { method: 'POST', body: JSON.stringify({ amount }) }),
  },
  lots: {
    list: (search?: string) =>
      request<CoffeeLot[]>(`/lots${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    get: (id: string) => request<CoffeeLot>(`/lots/${id}`),
    getCart: () =>
      request<CartItem[]>(`/lots/cart/items`),
    addToCart: (lotId: string, quantity = 1) =>
      request('/lots/cart', { method: 'POST', body: JSON.stringify({ lotId, quantity }) }),
  },
  auctions: {
    list: () => request<Auction[]>('/auctions'),
    get: (lotId: string) => request<Auction>(`/auctions/${lotId}`),
    bid: (lotId: string, amount: number, autoBid = false) =>
      request(`/auctions/${lotId}/bid`, {
        method: 'POST',
        body: JSON.stringify({ amount, autoBid }),
      }),
  },
  logistics: {
    list: () => request<Shipment[]>('/logistics'),
    get: (id: string) => request<Shipment>(`/logistics/${id}`),
    verifyQr: (code: string) =>
      request<{ verified: boolean; shipment: Shipment }>(`/logistics/verify/qr?code=${encodeURIComponent(code)}`),
  },
  quality: {
    scan: (lotId?: string) =>
      request<QualityCheck>('/quality/scan', {
        method: 'POST',
        body: JSON.stringify({ lotId }),
      }),
  },
};

export interface CartItem {
  id: string;
  userId: string;
  lotId: string;
  quantity: number;
  lot: CoffeeLot;
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
  inAuction: boolean;
}

export interface Auction {
  id: string;
  lotId: string;
  currentBid: number;
  endsAt: string;
  status: string;
  bids: { id: string; bidderName: string; amount: number; createdAt: string }[];
  lot?: CoffeeLot;
}

export interface Shipment {
  id: string;
  lotId: string;
  lotNumber: string;
  status: string;
  qrCode: string;
  events: { id: string; status: string; location: string; timestamp: string }[];
}

export interface Tour {
  id: string;
  title: string;
  description: string;
  type: string;
  duration: string;
  rating: number;
  reviewCount: number;
  locationName: string;
  address: string;
  city: string;
  country: string;
  pricePerGuest: number;
  bookingFee: number;
  currency: string;
}

export interface TourSlot {
  id: string;
  tourId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedGuests: number;
  status: string;
}

export interface Booking {
  id: string;
  userId: string;
  tourId: string;
  slotId: string;
  guests: number;
  subtotal: number;
  bookingFee: number;
  totalAmount: number;
  currency: string;
  status: string;
  ticketCode?: string;
  paymentMethod: string;
  paymentPhone: string;
  confirmedAt?: string;
  expiresAt: string;
  createdAt: string;
  tour?: Tour;
  slot?: TourSlot;
}

export interface CreateBookingResult {
  bookingId: string;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  providerReference: string;
  expiresAt: string;
}

export interface TicketPayload {
  ticketCode: string;
  verifyUrl: string;
  booking: {
    id: string;
    tour: string;
    location: string;
    date: string;
    startTime: string;
    endTime: string;
    guests: number;
    totalAmount: number;
    currency: string;
  };
}

export interface Review {
  id: string;
  tourId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
}

export function formatUGX(amount: number): string {
  return `UGX ${Math.abs(amount).toLocaleString('en-UG')}`;
}

export function providerLabel(provider: string): string {
  switch (provider) {
    case 'mtn_momo':
      return 'MTN MoMo';
    case 'airtel_money':
      return 'Airtel Money';
    case 'wallet':
      return 'Wallet';
    default:
      return provider;
  }
}

export interface QualityCheck {
  id: string;
  lotId: string;
  lotName: string;
  grade: string;
  points: number;
  scannedAt: string;
  recommendations: string[];
}
