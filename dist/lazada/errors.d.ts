export interface LazadaErrorOptions {
    code: string;
    message: string;
    requestId?: string;
    details?: Record<string, unknown>;
    status?: number;
}
export declare class LazadaError extends Error {
    readonly code: string;
    readonly requestId?: string;
    readonly details?: Record<string, unknown>;
    readonly status?: number;
    constructor(options: LazadaErrorOptions);
}
export declare class LazadaApiError extends LazadaError {
    constructor(options: LazadaErrorOptions);
}
export declare class LazadaAuthError extends LazadaError {
    constructor(options: LazadaErrorOptions);
}
export declare class LazadaNetworkError extends LazadaError {
    constructor(options: LazadaErrorOptions);
}
export declare function isLazadaError(err: unknown): err is LazadaError;
