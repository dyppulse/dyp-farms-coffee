import { MtnMomoConfig } from '../../types';

const SANDBOX_BASE = 'https://sandbox.momodeveloper.mtn.com';
const PROD_BASE = 'https://proxy.momoapi.mtn.com';

export function getMtnBaseUrl(env: string): string {
  return env === 'sandbox' ? SANDBOX_BASE : PROD_BASE;
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('256')) return digits;
  if (digits.startsWith('0')) return `256${digits.slice(1)}`;
  return digits;
}

export interface MtnTokenResponse {
  access_token: string;
  expires_in: number;
}

export async function fetchMtnToken(config: MtnMomoConfig): Promise<string> {
  const base = getMtnBaseUrl(config.targetEnvironment);
  const credentials = Buffer.from(`${config.apiUser}:${config.apiKey}`).toString('base64');
  const res = await fetch(`${base}/collection/token/`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Ocp-Apim-Subscription-Key': config.subscriptionKey,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MTN token failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as MtnTokenResponse;
  return data.access_token;
}

export async function requestToPay(
  config: MtnMomoConfig,
  token: string,
  params: {
    referenceId: string;
    amount: number;
    currency: string;
    phone: string;
    externalId: string;
    payerMessage: string;
  },
): Promise<void> {
  const base = getMtnBaseUrl(config.targetEnvironment);
  const res = await fetch(`${base}/collection/v1_0/requesttopay`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Reference-Id': params.referenceId,
      'X-Target-Environment': config.targetEnvironment,
      'Ocp-Apim-Subscription-Key': config.subscriptionKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: String(params.amount),
      currency: params.currency,
      externalId: params.externalId,
      payer: { partyIdType: 'MSISDN', partyId: params.phone },
      payerMessage: params.payerMessage,
      payeeNote: params.payerMessage,
    }),
  });
  if (res.status !== 202 && !res.ok) {
    const text = await res.text();
    throw new Error(`MTN requestToPay failed: ${res.status} ${text}`);
  }
}

export async function getRequestToPayStatus(
  config: MtnMomoConfig,
  token: string,
  referenceId: string,
): Promise<{ status: string; amount?: string; currency?: string; externalId?: string }> {
  const base = getMtnBaseUrl(config.targetEnvironment);
  const res = await fetch(`${base}/collection/v1_0/requesttopay/${referenceId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Target-Environment': config.targetEnvironment,
      'Ocp-Apim-Subscription-Key': config.subscriptionKey,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MTN status check failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<{
    status: string;
    amount?: string;
    currency?: string;
    externalId?: string;
  }>;
}

export function mapMtnStatus(status: string): 'pending' | 'successful' | 'failed' | 'expired' {
  switch (status.toUpperCase()) {
    case 'SUCCESSFUL':
      return 'successful';
    case 'FAILED':
      return 'failed';
    case 'PENDING':
      return 'pending';
    default:
      return 'pending';
  }
}
