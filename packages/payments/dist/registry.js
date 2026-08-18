"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderRegistry = void 0;
const errors_1 = require("./errors");
class ProviderRegistry {
    constructor() {
        this.providers = new Map();
    }
    register(provider) {
        this.providers.set(provider.method, provider);
    }
    get(method) {
        const provider = this.providers.get(method);
        if (!provider)
            throw new errors_1.ProviderNotFoundError(method);
        return provider;
    }
    listMethods() {
        return [...this.providers.keys()];
    }
}
exports.ProviderRegistry = ProviderRegistry;
