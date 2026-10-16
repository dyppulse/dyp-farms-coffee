import { renderHook, waitFor } from '@testing-library/react-native';
import { api } from '../../api/client';
import { usePaymentsAvailable } from '../usePaymentsAvailable';

jest.mock('../../api/client', () => ({ api: { wallet: { paymentMethods: jest.fn() } } }));
const paymentMethods = api.wallet.paymentMethods as jest.Mock;

describe('usePaymentsAvailable', () => {
  it('reports unavailable when the API lists no methods', async () => {
    paymentMethods.mockResolvedValueOnce({ methods: [] });
    const { result } = renderHook(() => usePaymentsAvailable());
    await waitFor(() => expect(result.current.checked).toBe(true));
    expect(result.current.available).toBe(false);
  });

  it('reports available when methods exist', async () => {
    paymentMethods.mockResolvedValueOnce({ methods: ['mtn_momo'] });
    const { result } = renderHook(() => usePaymentsAvailable());
    await waitFor(() => expect(result.current.checked).toBe(true));
    expect(result.current.available).toBe(true);
  });

  it('assumes available when the check fails, so the server decides', async () => {
    paymentMethods.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => usePaymentsAvailable());
    await waitFor(() => expect(result.current.checked).toBe(true));
    expect(result.current.available).toBe(true);
  });
});
