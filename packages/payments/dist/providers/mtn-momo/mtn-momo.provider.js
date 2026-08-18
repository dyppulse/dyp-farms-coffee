"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MtnMomoProvider = void 0;
const mtn_momo_client_1 = require("./mtn-momo.client");
const crypto_1 = require("crypto");
class MtnMomoProvider {
    constructor(config) {
        this.config = config;
        this.method = 'mtn_momo';
    }
    async initiateCollection(req) {
        const referenceId = (0, crypto_1.randomUUID)();
        const phone = (0, mtn_momo_client_1.normalizePhone)(req.payerPhone);
        const token = await (0, mtn_momo_client_1.fetchMtnToken)(this.config);
        await (0, mtn_momo_client_1.requestToPay)(this.config, token, {
            referenceId,
            amount: req.money.amount,
            currency: req.money.currency || this.config.currency || 'UGX',
            phone,
            externalId: req.reference,
            payerMessage: req.description,
        });
        return { providerReference: referenceId, status: 'pending' };
    }
    async verifyPayment(providerReference) {
        const token = await (0, mtn_momo_client_1.fetchMtnToken)(this.config);
        const data = await (0, mtn_momo_client_1.getRequestToPayStatus)(this.config, token, providerReference);
        return {
            providerReference,
            status: (0, mtn_momo_client_1.mapMtnStatus)(data.status),
            raw: data,
        };
    }
    parseWebhook(_headers, body) {
        const payload = body;
        return {
            method: 'mtn_momo',
            providerReference: payload.financialTransactionId || '',
            merchantReference: payload.externalId || '',
            status: (0, mtn_momo_client_1.mapMtnStatus)(payload.status || 'PENDING'),
            money: {
                amount: Number(payload.amount || 0),
                currency: payload.currency || 'UGX',
            },
            occurredAt: new Date(),
        };
    }
}
exports.MtnMomoProvider = MtnMomoProvider;
