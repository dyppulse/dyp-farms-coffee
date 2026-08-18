import { MtnMomoConfig } from '../../types';
export declare function getMtnBaseUrl(env: string): string;
export declare function normalizePhone(phone: string): string;
export interface MtnTokenResponse {
    access_token: string;
    expires_in: number;
}
export declare function fetchMtnToken(config: MtnMomoConfig): Promise<string>;
export declare function requestToPay(config: MtnMomoConfig, token: string, params: {
    referenceId: string;
    amount: number;
    currency: string;
    phone: string;
    externalId: string;
    payerMessage: string;
}): Promise<void>;
export declare function getRequestToPayStatus(config: MtnMomoConfig, token: string, referenceId: string): Promise<{
    status: string;
    amount?: string;
    currency?: string;
    externalId?: string;
}>;
export declare function mapMtnStatus(status: string): 'pending' | 'successful' | 'failed' | 'expired';
