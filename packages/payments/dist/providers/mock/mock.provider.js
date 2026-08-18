"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAirtelProvider = exports.MockMomoProvider = void 0;
const pending = new Map();
class MockMomoProvider {
    constructor() {
        this.method = 'mtn_momo';
    }
    async initiateCollection(req) {
        const ref = `mock-${req.reference}`;
        pending.set(ref, req);
        return { providerReference: ref, status: 'pending' };
    }
    async verifyPayment(providerReference) {
        return { providerReference, status: 'pending' };
    }
    parseWebhook(_headers, body) {
        const payload = body;
        return {
            method: 'mtn_momo',
            providerReference: payload.providerReference,
            merchantReference: payload.merchantReference,
            status: payload.status,
            money: { amount: payload.amount, currency: payload.currency || 'UGX' },
            occurredAt: new Date(),
        };
    }
    static simulateSuccess(providerReference) {
        return pending.get(providerReference);
    }
}
exports.MockMomoProvider = MockMomoProvider;
class MockAirtelProvider {
    constructor() {
        this.method = 'airtel_money';
    }
    async initiateCollection(req) {
        const ref = `mock-airtel-${req.reference}`;
        return { providerReference: ref, status: 'pending' };
    }
    async verifyPayment(providerReference) {
        return { providerReference, status: 'pending' };
    }
    parseWebhook(_headers, body) {
        const payload = body;
        return {
            method: 'airtel_money',
            providerReference: payload.transaction.id,
            merchantReference: payload.reference,
            status: payload.transaction.status === 'TS' ? 'successful' : 'failed',
            money: { amount: payload.transaction.amount, currency: 'UGX' },
            occurredAt: new Date(),
        };
    }
}
exports.MockAirtelProvider = MockAirtelProvider;
