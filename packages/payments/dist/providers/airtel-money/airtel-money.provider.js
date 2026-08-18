"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirtelMoneyProvider = void 0;
const airtel_money_client_1 = require("./airtel-money.client");
const crypto_1 = require("crypto");
class AirtelMoneyProvider {
    constructor(config) {
        this.config = config;
        this.method = 'airtel_money';
    }
    async initiateCollection(req) {
        const transactionId = (0, crypto_1.randomUUID)();
        const phone = (0, airtel_money_client_1.normalizeAirtelPhone)(req.payerPhone);
        const token = await (0, airtel_money_client_1.fetchAirtelToken)(this.config);
        const result = await (0, airtel_money_client_1.airtelCollect)(this.config, token, {
            reference: req.reference,
            amount: req.money.amount,
            currency: req.money.currency || this.config.currency || 'UGX',
            phone,
            transactionId,
        });
        const status = (0, airtel_money_client_1.mapAirtelStatus)(result.data?.transaction?.status);
        return {
            providerReference: transactionId,
            status,
            raw: result,
        };
    }
    async verifyPayment(providerReference) {
        const token = await (0, airtel_money_client_1.fetchAirtelToken)(this.config);
        const data = await (0, airtel_money_client_1.getAirtelTransactionStatus)(this.config, token, providerReference);
        return {
            providerReference,
            status: (0, airtel_money_client_1.mapAirtelStatus)(data.data?.transaction?.status),
            raw: data,
        };
    }
    parseWebhook(_headers, body) {
        const payload = body;
        const tx = payload.transaction || {};
        return {
            method: 'airtel_money',
            providerReference: tx.id || '',
            merchantReference: payload.reference || '',
            status: (0, airtel_money_client_1.mapAirtelStatus)(tx.status),
            money: {
                amount: Number(tx.amount || 0),
                currency: this.config.currency || 'UGX',
            },
            occurredAt: new Date(),
        };
    }
}
exports.AirtelMoneyProvider = AirtelMoneyProvider;
