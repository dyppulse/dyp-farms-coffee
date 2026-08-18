"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderNotFoundError = exports.ProviderError = exports.PaymentError = void 0;
class PaymentError extends Error {
    constructor(message, code, cause) {
        super(message);
        this.code = code;
        this.cause = cause;
        this.name = 'PaymentError';
    }
}
exports.PaymentError = PaymentError;
class ProviderError extends PaymentError {
    constructor(message, cause) {
        super(message, 'PROVIDER_ERROR', cause);
        this.name = 'ProviderError';
    }
}
exports.ProviderError = ProviderError;
class ProviderNotFoundError extends PaymentError {
    constructor(method) {
        super(`Payment provider not registered: ${method}`, 'PROVIDER_NOT_FOUND');
        this.name = 'ProviderNotFoundError';
    }
}
exports.ProviderNotFoundError = ProviderNotFoundError;
