import { AirtelMoneyConfig } from '../../types';
export declare function getAirtelBaseUrl(country: string): string;
export declare function normalizeAirtelPhone(phone: string): string;
export declare function fetchAirtelToken(config: AirtelMoneyConfig): Promise<string>;
export declare function airtelCollect(config: AirtelMoneyConfig, token: string, params: {
    reference: string;
    amount: number;
    currency: string;
    phone: string;
    transactionId: string;
}): Promise<{
    status?: {
        code?: string;
        message?: string;
    };
    data?: {
        transaction?: {
            id?: string;
            status?: string;
        };
    };
}>;
export declare function getAirtelTransactionStatus(config: AirtelMoneyConfig, token: string, transactionId: string): Promise<{
    data?: {
        transaction?: {
            status?: string;
            id?: string;
        };
    };
}>;
export declare function mapAirtelStatus(status?: string): 'pending' | 'successful' | 'failed' | 'expired';
