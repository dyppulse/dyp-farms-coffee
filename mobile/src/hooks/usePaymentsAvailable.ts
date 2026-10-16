import { useEffect, useState } from 'react';
import { api } from '../api/client';

/**
 * Whether the API currently accepts payments. The API lists no methods while payments are
 * switched off. If the check itself fails we assume payments work and let the server decide.
 */
export function usePaymentsAvailable(): { checked: boolean; available: boolean } {
  const [state, setState] = useState({ checked: false, available: true });

  useEffect(() => {
    let alive = true;
    api.wallet
      .paymentMethods()
      .then((r) => alive && setState({ checked: true, available: r.methods.length > 0 }))
      .catch(() => alive && setState({ checked: true, available: true }));
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

export const PAYMENTS_OFF_MESSAGE =
  'Payments are not available yet. Please check back soon.';
