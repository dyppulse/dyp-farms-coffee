// The browser talks to its own origin (/api): Vercel proxies it to the Render API (see
// vercel.json) and the Vite dev server does the same locally. That keeps the httpOnly session
// cookie first-party. Set VITE_API_BASE only to point somewhere else on purpose.
const API_URL = import.meta.env.VITE_API_BASE ?? '/api';

// The session lives in an httpOnly cookie the browser manages, so JavaScript never sees the
// token. Old versions kept it in localStorage; clear any leftover copy.
export function clearLegacySession() {
  try {
    localStorage.removeItem('dyp_web_token');
    localStorage.removeItem('dyp_web_user');
  } catch {
    // storage unavailable
  }
}

// Set once a request succeeds as a signed-in user, so a 401 on a later request can be told
// apart from "never signed in".
let hadSession = false;

// Render's free tier sleeps when idle; a cold start takes up to ~50s, so don't give up
// before then — but tell the user what's happening after a few seconds.
const REQUEST_TIMEOUT_MS = 70_000;
const SLOW_AFTER_MS = 4_000;

export type ApiErrorKind = 'network' | 'timeout' | 'unavailable' | 'unauthorized' | 'http';

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;
  constructor(message: string, kind: ApiErrorKind, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

const API_HOST = (() => {
  try {
    return new URL(API_URL).host;
  } catch {
    return API_URL;
  }
})();

// Called when an authenticated request comes back 401 (expired token, or the user no
// longer exists after a backend restart). AuthContext registers this to clear the session.
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

// Tracks whether any in-flight request has been pending long enough to look "stuck" so
// the UI can show a "waking up the server" notice instead of a silent spinner.
let slowCount = 0;
const slowListeners = new Set<() => void>();
function emitSlow() {
  slowListeners.forEach((l) => l());
}
export function subscribeSlow(listener: () => void) {
  slowListeners.add(listener);
  return () => {
    slowListeners.delete(listener);
  };
}
export function isServerSlow() {
  return slowCount > 0;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // Required by the API for cookie-authenticated writes (CSRF defence).
    'X-Dyp-Client': 'web',
    ...(options.headers as Record<string, string>),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let markedSlow = false;
  const slowTimer = setTimeout(() => {
    markedSlow = true;
    slowCount += 1;
    emitSlow();
  }, SLOW_AFTER_MS);

  function settle() {
    clearTimeout(timeout);
    clearTimeout(slowTimer);
    if (markedSlow) {
      markedSlow = false;
      slowCount -= 1;
      emitSlow();
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });
  } catch (e) {
    settle();
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ApiError(
        'The server took too long to respond. It may be waking up — please try again in a moment.',
        'timeout',
      );
    }
    throw new ApiError(
      `Can't reach the server (${API_HOST}). Check your connection — if you're online, the API may be down or blocked by your network or DNS.`,
      'network',
    );
  }
  settle();

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const msg = Array.isArray(error.message) ? error.message.join(', ') : error.message;

    // 401 on a logged-in request means the session is no longer valid. Login/signup 401s
    // ("Invalid credentials") are normal form errors and must not log the user out.
    if (response.status === 401 && hadSession && !path.startsWith('/auth/')) {
      hadSession = false;
      unauthorizedHandler?.();
      throw new ApiError('Your session has expired. Please log in again.', 'unauthorized', 401);
    }
    if ([502, 503, 504].includes(response.status)) {
      throw new ApiError(
        'The server is starting up or temporarily unavailable. Please try again in a moment.',
        'unavailable',
        response.status,
      );
    }
    throw new ApiError(msg || `Request failed: ${response.status}`, 'http', response.status);
  }

  if (path.startsWith('/auth/login') || path.startsWith('/auth/signup') || path === '/auth/me') {
    hadSession = true;
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

export type TicketStatus = 'open' | 'in_progress' | 'resolved';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketTeam = 'payments' | 'logistics' | 'quality' | 'agronomy' | 'engineering';

export const TICKET_TEAMS: TicketTeam[] = ['payments', 'logistics', 'quality', 'agronomy', 'engineering'];
export const TICKET_PRIORITIES: TicketPriority[] = ['low', 'normal', 'high', 'urgent'];

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  body: string;
  status: TicketStatus;
  priority: TicketPriority;
  team: TicketTeam | null;
  escalationRequestedAt: string | null;
  escalatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { comments: number };
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  kind: 'comment' | 'event';
  body: string;
  internal: boolean;
  createdAt: string;
}

export interface TicketWithUser extends SupportTicket {
  user: { id: string; name: string; email: string } | null;
}

export interface TicketDetail extends TicketWithUser {
  comments: TicketComment[];
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
    me: () => request<{ user: AuthUser }>('/auth/me'),
    logout: () => request<{ loggedOut: boolean }>('/auth/logout', { method: 'POST' }),
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
    get: (id: string) => request<TicketDetail>(`/tickets/${id}`),
    create: (data: { subject: string; body: string }) =>
      request<SupportTicket>('/tickets', { method: 'POST', body: JSON.stringify(data) }),
    comment: (id: string, body: string) =>
      request<TicketComment>(`/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),
    requestEscalation: (id: string, reason: string) =>
      request<TicketDetail>(`/tickets/${id}/escalation-request`, { method: 'POST', body: JSON.stringify({ reason }) }),
  },
  admin: {
    farms: () => request<FarmWithOwner[]>('/admin/farms'),
    stats: () => request<AdminStats>('/admin/stats'),
    tickets: () => request<TicketWithUser[]>('/admin/tickets'),
    ticket: (id: string) => request<TicketDetail>(`/admin/tickets/${id}`),
    updateTicket: (id: string, data: { status?: TicketStatus; priority?: TicketPriority }) =>
      request<SupportTicket>(`/admin/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    commentOnTicket: (id: string, body: string, internal: boolean) =>
      request<TicketComment>(`/admin/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify({ body, internal }) }),
    escalateTicket: (id: string, data: { team: TicketTeam; priority?: TicketPriority; note?: string }) =>
      request<TicketDetail>(`/admin/tickets/${id}/escalate`, { method: 'POST', body: JSON.stringify(data) }),
  },
};

export function formatUGX(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(amount);
}
