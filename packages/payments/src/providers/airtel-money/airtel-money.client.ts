import { AirtelMoneyConfig } from '../../types';

const AIRTEL_BASE: Record<string, string> = {
  UG: 'https://openapiuat.airtel.africa',
  KE: 'https://openapiuat.airtel.africa',
};

export function getAirtelBaseUrl(country: string): string {
  return AIRTEL_BASE[country.toUpperCase()] || AIRTEL_BASE.UG;
}

export function normalizeAirtelPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('256')) return digits;
  if (digits.startsWith('0')) return `256${digits.slice(1)}`;
  return digits;
}

export async function fetchAirtelToken(config: AirtelMoneyConfig): Promise<string> {
  const base = getAirtelBaseUrl(config.country);
  const res = await fetch(`${base}/auth/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'client_credentials',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtel token failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function airtelCollect(
  config: AirtelMoneyConfig,
  token: string,
  params: {
    reference: string;
    amount: number;
    currency: string;
    phone: string;
    transactionId: string;
  },
): Promise<{ status?: { code?: string; message?: string }; data?: { transaction?: { id?: string; status?: string } } }> {
  const base = getAirtelBaseUrl(config.country);
  const res = await fetch(`${base}/merchant/v1/payments/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Country': config.country,
      'X-Currency': params.currency,
    },
    body: JSON.stringify({
      reference: params.reference,
      subscriber: {
        country: config.country,
        currency: params.currency,
        msisdn: params.phone,
      },
      transaction: {
        amount: params.amount,
        country: config.country,
        currency: params.currency,
        id: params.transactionId,
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Airtel collect failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

export async function getAirtelTransactionStatus(
  config: AirtelMoneyConfig,
  token: string,
  transactionId: string,
): Promise<{ data?: { transaction?: { status?: string; id?: string } } }> {
  const base = getAirtelBaseUrl(config.country);
  const res = await fetch(`${base}/standard/v1/payments/${transactionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Country': config.country,
      'X-Currency': config.currency || 'UGX',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtel status failed: ${res.status} ${text}`);
  }
  return res.json();
}

export function mapAirtelStatus(status?: string): 'pending' | 'successful' | 'failed' | 'expired' {
  const s = (status || '').toUpperCase();
  if (s === 'TS' || s === 'SUCCESS' || s === 'SUCCESSFUL') return 'successful';
  if (s === 'TF' || s === 'FAILED') return 'failed';
  if (s === 'TA' || s === 'AMBIGUOUS') return 'pending';
  return 'pending';
}
