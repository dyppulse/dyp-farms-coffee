"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentGateway = void 0;
exports.createPaymentGateway = createPaymentGateway;
const registry_1 = require("./registry");
const mtn_momo_provider_1 = require("./providers/mtn-momo/mtn-momo.provider");
const airtel_money_provider_1 = require("./providers/airtel-money/airtel-money.provider");
class PaymentGateway {
    constructor(config) {
        this.registry = new registry_1.ProviderRegistry();
        if (config?.mtnMomo) {
            this.register(new mtn_momo_provider_1.MtnMomoProvider(config.mtnMomo));
        }
        if (config?.airtelMoney) {
            this.register(new airtel_money_provider_1.AirtelMoneyProvider(config.airtelMoney));
        }
    }
    register(provider) {
        this.registry.register(provider);
    }
    collect(req) {
        return this.registry.get(req.method).initiateCollection(req);
    }
    verify(method, providerReference) {
        return this.registry.get(method).verifyPayment(providerReference);
    }
    handleWebhook(method, headers, body) {
        const provider = this.registry.get(method);
        if (provider.verifyWebhookSignature && !provider.verifyWebhookSignature(headers, body)) {
            throw new Error('Invalid webhook signature');
        }
        return provider.parseWebhook(headers, body);
    }
    listMethods() {
        return this.registry.listMethods();
    }
}
exports.PaymentGateway = PaymentGateway;
function createPaymentGateway(config) {
    return new PaymentGateway(config);
}
