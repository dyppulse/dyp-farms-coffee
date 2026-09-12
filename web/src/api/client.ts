const API_URL = import.meta.env.VITE_API_URL ?? 'https://dyp-farms-api.onrender.com/api';

const TOKEN_KEY = 'dyp_web_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage unavailable (private mode, etc.) — session just won't persist
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('Network error. Check your connection and try again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const msg = Array.isArray(error.message) ? error.message.join(', ') : error.message;
    throw new Error(msg || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'farmer' | 'roaster' | 'tourist' | 'admin';
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
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
  farmerId?: string;
  farmId?: string;
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
  lot?: CoffeeLot;
}

export interface BoundaryPoint {
  lat: number;
  lng: number;
}

export interface Farm {
  id: string;
  ownerId: string;
  name: string;
  sizeHectares?: number | null;
  boundary: BoundaryPoint[];
  createdAt: string;
  updatedAt: string;
}

export interface FarmWithOwner extends Farm {
  owner: { id: string; name: string; email: string } | null;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'bid' | 'grading' | 'payment' | 'shipment' | 'weather' | 'general';
  title: string;
  body: string;
  entityType?: string | null;
  entityId?: string | null;
  read: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  body: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export interface TicketWithUser extends SupportTicket {
  user: { id: string; name: string; email: string } | null;
}

export interface AdminStats {
  totalLots: number;
  totalVolumeKg: number;
  activeAuctions: number;
  totalFarms: number;
  openTickets: number;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    signup: (data: { email: string; password: string; name: string; role?: 'farmer' | 'roaster' | 'tourist' }) =>
      request<AuthResponse>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  },
  lots: {
    list: (search?: string) =>
      request<CoffeeLot[]>(`/lots${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    get: (id: string) => request<CoffeeLot>(`/lots/${id}`),
  },
  auctions: {
    list: () => request<Auction[]>('/auctions'),
    get: (lotId: string) => request<Auction>(`/auctions/${lotId}`),
    bid: (lotId: string, amount: number) =>
      request(`/auctions/${lotId}/bid`, { method: 'POST', body: JSON.stringify({ amount }) }),
  },
  farms: {
    list: () => request<Farm[]>('/farms'),
    create: (data: { name: string; sizeHectares?: number; boundary: BoundaryPoint[] }) =>
      request<Farm>('/farms', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id: string) => request(`/farms/${id}`, { method: 'DELETE' }),
  },
  notifications: {
    list: () => request<AppNotification[]>('/notifications'),
    markRead: (id: string) => request<AppNotification>(`/notifications/${id}/read`, { method: 'PATCH' }),
  },
  tickets: {
    list: () => request<SupportTicket[]>('/tickets'),
    create: (data: { subject: string; body: string }) =>
      request<SupportTicket>('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  },
  admin: {
    farms: () => request<FarmWithOwner[]>('/admin/farms'),
    stats: () => request<AdminStats>('/admin/stats'),
    tickets: () => request<TicketWithUser[]>('/admin/tickets'),
    updateTicketStatus: (id: string, status: SupportTicket['status']) =>
      request<SupportTicket>(`/admin/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },
};

export function formatUGX(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(amount);
}
