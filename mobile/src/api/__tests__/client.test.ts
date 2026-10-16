import { api, apiExtended, setAuthToken } from '../client';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('includes auth token in headers when set', async () => {
      setAuthToken('test-token-123');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await api.dashboard.get();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      );

      setAuthToken(null);
    });

    it('sends login request with email and password', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'new-token',
          user: { id: '1', email: 'test@example.com', name: 'Test', role: 'farmer' },
        }),
      });

      const result = await api.auth.login('test@example.com', 'password123');

      expect(result.accessToken).toBe('new-token');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('throws error on network failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(api.dashboard.get()).rejects.toThrow();
    });

    it('throws error on non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(api.dashboard.get()).rejects.toThrow('Unauthorized');
    });

    it('handles JSON parse errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(api.dashboard.get()).rejects.toThrow('Request failed: 500');
    });
  });

  describe('Lots API', () => {
    it('fetches lots list', async () => {
      const mockLots = [
        {
          id: '1',
          name: 'Ethiopian Yirgacheffe',
          origin: 'Ethiopia',
          price: 50,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLots,
      });

      const result = await api.lots.list();

      expect(result).toEqual(mockLots);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/lots'),
        expect.any(Object)
      );
    });

    it('searches lots with query', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await api.lots.list('Ethiopian');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=Ethiopian'),
        expect.any(Object)
      );
    });
  });

  describe('Carbon API', () => {
    it('calculates carbon footprint', async () => {
      const mockResult = {
        totalCo2kg: 2.5,
        certification: 'Low Carbon',
        offsetCost: 0.04,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result: any = await apiExtended.carbon.calculateFootprint({
        batchSize: 100,
        distance: 5000,
        transportMode: 'sea',
        origin: 'Ethiopia',
        certifications: ['organic'],
      });

      expect(result.totalCo2kg).toBe(2.5);
      expect(result.certification).toBe('Low Carbon');
    });
  });
});

describe('Generic request helpers', () => {
  const ok = (body: unknown) =>
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => body });

  beforeEach(() => jest.clearAllMocks());

  it('api.get sends a GET and returns the parsed body', async () => {
    ok({ receipts: [] });
    const result = await api.get('/receipts/user');
    expect(result).toEqual({ receipts: [] });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/receipts/user'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('api.post serialises the body as JSON', async () => {
    ok({ id: 'p1' });
    await api.post('/community/posts', { title: 'Hi' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/community/posts'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ title: 'Hi' }) }),
    );
  });

  it('api.post without a body sends none', async () => {
    ok({});
    await api.post('/subscriptions/1/skip');
    const init = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(init.body).toBeUndefined();
  });

  it('api.put uses the PUT method', async () => {
    ok({});
    await api.put('/subscriptions/1/frequency', { frequency: 'weekly' });
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe('PUT');
  });

  it('surfaces the server error message', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Insufficient balance' }),
    });
    await expect(api.post('/wallet/withdraw', { amount: 1 })).rejects.toThrow('Insufficient balance');
  });
});
