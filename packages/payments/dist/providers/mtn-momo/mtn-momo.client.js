"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMtnBaseUrl = getMtnBaseUrl;
exports.normalizePhone = normalizePhone;
exports.fetchMtnToken = fetchMtnToken;
exports.requestToPay = requestToPay;
exports.getRequestToPayStatus = getRequestToPayStatus;
exports.mapMtnStatus = mapMtnStatus;
const SANDBOX_BASE = 'https://sandbox.momodeveloper.mtn.com';
const PROD_BASE = 'https://proxy.momoapi.mtn.com';
function getMtnBaseUrl(env) {
    return env === 'sandbox' ? SANDBOX_BASE : PROD_BASE;
}
function normalizePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('256'))
        return digits;
    if (digits.startsWith('0'))
        return `256${digits.slice(1)}`;
    return digits;
}
async function fetchMtnToken(config) {
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
    const data = (await res.json());
    return data.access_token;
}
async function requestToPay(config, token, params) {
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
async function getRequestToPayStatus(config, token, referenceId) {
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
    return res.json();
}
function mapMtnStatus(status) {
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
