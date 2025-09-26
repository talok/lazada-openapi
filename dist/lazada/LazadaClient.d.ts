import type { HttpMethod, LazadaClientOptions, LazadaRequestParams, LazadaTokenResponse } from "../types.js";
export declare class LazadaClient {
    private readonly appKey;
    private readonly appSecret;
    private accessToken?;
    private refreshToken?;
    private readonly redirectUri?;
    private readonly region;
    private readonly apiBaseUrl;
    private readonly authBaseUrl;
    private readonly timeoutMs;
    private readonly tokenStore?;
    private readonly installationId;
    constructor(options: LazadaClientOptions);
    getAccessToken(): string | undefined;
    getRefreshToken(): string | undefined;
    initFromStore(): Promise<void>;
    buildAuthorizationUrl(state?: string, redirectUriOverride?: string): string;
    exchangeAuthCode(code: string, redirectUriOverride?: string): Promise<LazadaTokenResponse>;
    refreshAccessToken(refreshTokenOverride?: string): Promise<LazadaTokenResponse>;
    request<T = unknown>(method: HttpMethod, apiPath: string, params?: LazadaRequestParams, body?: unknown): Promise<T>;
    private isTokenExpiredSoon;
    ensureValidToken(): Promise<void>;
}
