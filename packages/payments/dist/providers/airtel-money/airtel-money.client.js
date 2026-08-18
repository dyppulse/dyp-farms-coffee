"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAirtelBaseUrl = getAirtelBaseUrl;
exports.normalizeAirtelPhone = normalizeAirtelPhone;
exports.fetchAirtelToken = fetchAirtelToken;
exports.airtelCollect = airtelCollect;
exports.getAirtelTransactionStatus = getAirtelTransactionStatus;
exports.mapAirtelStatus = mapAirtelStatus;
const AIRTEL_BASE = {
    UG: 'https://openapiuat.airtel.africa',
    KE: 'https://openapiuat.airtel.africa',
};
function getAirtelBaseUrl(country) {
    return AIRTEL_BASE[country.toUpperCase()] || AIRTEL_BASE.UG;
}
function normalizeAirtelPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('256'))
        return digits;
    if (digits.startsWith('0'))
        return `256${digits.slice(1)}`;
    return digits;
}
async function fetchAirtelToken(config) {
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
    const data = (await res.json());
    return data.access_token;
}
async function airtelCollect(config, token, params) {
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
async function getAirtelTransactionStatus(config, token, transactionId) {
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
function mapAirtelStatus(status) {
    const s = (status || '').toUpperCase();
    if (s === 'TS' || s === 'SUCCESS' || s === 'SUCCESSFUL')
        return 'successful';
    if (s === 'TF' || s === 'FAILED')
        return 'failed';
    if (s === 'TA' || s === 'AMBIGUOUS')
        return 'pending';
    return 'pending';
}
