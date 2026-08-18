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
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  // Let fetch set multipart boundary when uploading FormData
  if (isFormData) {
    delete headers['Content-Type'];
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
    const msg = Array.isArray(error.message)
      ? error.message.join(', ')
      : error.message;
    throw new Error(msg || `Request failed: ${response.status}`);
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
    signup: (data: {
      email: string;
      password: string;
      name: string;
      role?: 'farmer' | 'roaster' | 'tourist';
    }) =>
      request<{
        accessToken: string;
        user: {
          id: string;
          email: string;
          name: string;
          role: string;
        };
      }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
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
    scan: (input: {
      imageUri: string;
      mimeType?: string;
      fileName?: string;
      lotId?: string;
      variety?: string;
      moistureNote?: string;
    }) => {
      const form = new FormData();
      form.append('image', {
        uri: input.imageUri,
        name: input.fileName ?? 'coffee-scan.jpg',
        type: input.mimeType ?? 'image/jpeg',
      } as unknown as Blob);
      if (input.lotId) form.append('lotId', input.lotId);
      if (input.variety) form.append('variety', input.variety);
      if (input.moistureNote) form.append('moistureNote', input.moistureNote);
      return request<QualityCheck>('/quality/scan', {
        method: 'POST',
        body: form,
      });
    },
  },
};

export const apiExtended = {
  ...api,
  receipts: {
    getUserReceipts: () => request('/receipts/user', { method: 'GET' }),
    getReceipt: (receiptId: string) => request(`/receipts/${receiptId}`, { method: 'GET' }),
    shareReceipt: (receiptId: string, format: 'pdf' | 'email' | 'link') =>
      request(`/receipts/${receiptId}/share`, { method: 'POST', body: JSON.stringify({ format }) }),
  },
  financing: {
    calculateOffer: (receiptValue: number) =>
      request('/financing/calculate-offer', { method: 'POST', body: JSON.stringify({ receiptValue }) }),
    requestLoan: (data: { lotId: string; receiptId: string; amount: number; duration: number }) =>
      request('/financing/request-loan', { method: 'POST', body: JSON.stringify(data) }),
    getRequests: () => request('/financing/requests', { method: 'GET' }),
    getRequest: (requestId: string) => request(`/financing/requests/${requestId}`, { method: 'GET' }),
    approveLoan: (requestId: string) =>
      request(`/financing/requests/${requestId}/approve`, { method: 'POST' }),
    fundLoan: (requestId: string) =>
      request(`/financing/requests/${requestId}/fund`, { method: 'POST' }),
  },
  community: {
    createPost: (data: { title: string; content: string; category: string }) =>
      request('/community/posts', { method: 'POST', body: JSON.stringify(data) }),
    getPosts: (category?: string) =>
      request(`/community/posts${category ? `?category=${category}` : ''}`, { method: 'GET' }),
    getPost: (postId: string) => request(`/community/posts/${postId}`, { method: 'GET' }),
    likePost: (postId: string) =>
      request(`/community/posts/${postId}/like`, { method: 'POST' }),
    addReply: (postId: string, content: string) =>
      request(`/community/posts/${postId}/replies`, { method: 'POST', body: JSON.stringify({ content }) }),
    startChat: () => request('/community/chat/start', { method: 'POST' }),
    sendMessage: (conversationId: string, message: string) =>
      request(`/community/chat/${conversationId}/send`, { method: 'POST', body: JSON.stringify({ message }) }),
    getChatHistory: (conversationId: string) =>
      request(`/community/chat/${conversationId}`, { method: 'GET' }),
  },
  subscriptions: {
    getPlans: () => request('/subscriptions/plans', { method: 'GET' }),
    getPlan: (planId: string) => request(`/subscriptions/plans/${planId}`, { method: 'GET' }),
    createSubscription: (planId: string) =>
      request('/subscriptions/create', { method: 'POST', body: JSON.stringify({ planId }) }),
    getMySubscription: () => request('/subscriptions/my-subscription', { method: 'GET' }),
    updatePlan: (subscriptionId: string, planId: string) =>
      request(`/subscriptions/${subscriptionId}/plan`, { method: 'PUT', body: JSON.stringify({ planId }) }),
    updateFrequency: (subscriptionId: string, frequency: string) =>
      request(`/subscriptions/${subscriptionId}/frequency`, { method: 'PUT', body: JSON.stringify({ frequency }) }),
    pauseSubscription: (subscriptionId: string) =>
      request(`/subscriptions/${subscriptionId}/pause`, { method: 'POST' }),
    resumeSubscription: (subscriptionId: string) =>
      request(`/subscriptions/${subscriptionId}/resume`, { method: 'POST' }),
    cancelSubscription: (subscriptionId: string) =>
      request(`/subscriptions/${subscriptionId}/cancel`, { method: 'POST' }),
    skipDelivery: (subscriptionId: string) =>
      request(`/subscriptions/${subscriptionId}/skip`, { method: 'POST' }),
  },
};

// For convenience, also add generic get/post methods
export function get(path: string) {
  return request(path, { method: 'GET' });
}

export function post(path: string, body?: any) {
  return request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
}

export function put(path: string, body?: any) {
  return request(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
}

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
  lotId?: string;
  lotName?: string;
  grade: string;
  points: number;
  scannedAt: string;
  recommendations: string[];
  summary?: string;
  moistureEstimate?: string;
  defectRate?: string;
  screenSize?: string;
  colourScore?: string;
  model?: string;
}
