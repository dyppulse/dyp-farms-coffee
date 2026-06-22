export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class ProviderError extends PaymentError {
  constructor(message: string, cause?: unknown) {
    super(message, 'PROVIDER_ERROR', cause);
    this.name = 'ProviderError';
  }
}

export class ProviderNotFoundError extends PaymentError {
  constructor(method: string) {
    super(`Payment provider not registered: ${method}`, 'PROVIDER_NOT_FOUND');
    this.name = 'ProviderNotFoundError';
  }
}
