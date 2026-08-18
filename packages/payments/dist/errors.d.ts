export declare class PaymentError extends Error {
    readonly code: string;
    readonly cause?: unknown | undefined;
    constructor(message: string, code: string, cause?: unknown | undefined);
}
export declare class ProviderError extends PaymentError {
    constructor(message: string, cause?: unknown);
}
export declare class ProviderNotFoundError extends PaymentError {
    constructor(method: string);
}
