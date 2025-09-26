import { createHttpClient } from "./http.js";
import { REGION_API_HOSTS, REGION_AUTH_HOSTS, DEFAULT_TIMEOUT_MS, } from "./constants.js";
import { generateSignature } from "./signature.js";
import { LazadaApiError, LazadaAuthError } from "./errors.js";
export class LazadaClient {
    appKey;
    appSecret;
    accessToken;
    refreshToken;
    redirectUri;
    region;
    apiBaseUrl;
    authBaseUrl;
    timeoutMs;
    tokenStore;
    installationId;
    constructor(options) {
        if (!options.appKey)
            throw new LazadaAuthError({
                code: "CONFIG_ERROR",
                message: "appKey is required",
            });
        if (!options.appSecret)
            throw new LazadaAuthError({
                code: "CONFIG_ERROR",
                message: "appSecret is required",
            });
        this.appKey = options.appKey;
        this.appSecret = options.appSecret;
        this.redirectUri = options.redirectUri;
        this.accessToken = options.accessToken;
        this.refreshToken = options.refreshToken;
        this.region = options.region ?? "global";
        this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        this.apiBaseUrl =
            options.baseApiUrlOverride ?? REGION_API_HOSTS[this.region];
        this.authBaseUrl =
            options.baseAuthUrlOverride ?? REGION_AUTH_HOSTS[this.region];
        this.tokenStore = options.tokenStore;
        this.installationId = options.installationId ?? "default";
    }
    getAccessToken() {
        return this.accessToken;
    }
    getRefreshToken() {
        return this.refreshToken;
    }
    async initFromStore() {
        if (!this.tokenStore)
            return;
        await this.tokenStore.init();
        const tokens = await this.tokenStore.get(this.installationId);
        if (tokens) {
            this.accessToken = tokens.accessToken;
            this.refreshToken = tokens.refreshToken;
        }
    }
    buildAuthorizationUrl(state, redirectUriOverride) {
        const redirectUri = encodeURIComponent(redirectUriOverride ?? this.redirectUri ?? "");
        const base = `${this.authBaseUrl}/oauth/authorize`;
        const params = new URLSearchParams({
            response_type: "code",
            force_auth: "true",
            client_id: this.appKey,
        });
        if (redirectUri)
            params.set("redirect_uri", decodeURIComponent(redirectUri));
        if (state)
            params.set("state", state);
        return `${base}?${params.toString()}`;
    }
    async exchangeAuthCode(code, redirectUriOverride) {
        if (!code)
            throw new LazadaAuthError({
                code: "AUTH_CODE_REQUIRED",
                message: "Authorization code is required",
            });
        const http = createHttpClient(this.authBaseUrl, this.timeoutMs);
        const url = `/oauth/access_token`;
        const data = new URLSearchParams({
            app_key: this.appKey,
            app_secret: this.appSecret,
            code,
            sign_method: "sha256",
        });
        const redirectUri = redirectUriOverride ?? this.redirectUri;
        if (redirectUri)
            data.set("redirect_uri", redirectUri);
        const res = await http.post(url, data);
        const payload = res.data;
        if (!payload || !payload.access_token) {
            throw new LazadaAuthError({
                code: "TOKEN_EXCHANGE_FAILED",
                message: "Missing access_token in response",
                details: { payload },
            });
        }
        const token = {
            access_token: payload.access_token,
            refresh_token: payload.refresh_token,
            expires_in: Number(payload.expires_in ?? 0),
            account_user_id: payload.account_user_id,
            country: payload.country,
            refresh_expires_in: payload.refresh_expires_in
                ? Number(payload.refresh_expires_in)
                : undefined,
            token_type: payload.token_type,
            expires_at: Date.now() + Number(payload.expires_in ?? 0) * 1000,
        };
        this.accessToken = token.access_token;
        this.refreshToken = token.refresh_token;
        if (this.tokenStore) {
            await this.tokenStore.set({
                installationId: this.installationId,
                accessToken: token.access_token,
                refreshToken: token.refresh_token,
                expiresAt: token.expires_at ?? Date.now() + token.expires_in * 1000,
            });
        }
        return token;
    }
    async refreshAccessToken(refreshTokenOverride) {
        const token = refreshTokenOverride ?? this.refreshToken;
        if (!token)
            throw new LazadaAuthError({
                code: "REFRESH_TOKEN_REQUIRED",
                message: "refresh_token is required",
            });
        const http = createHttpClient(this.authBaseUrl, this.timeoutMs);
        const url = `/oauth/refresh_token`;
        const data = new URLSearchParams({
            app_key: this.appKey,
            app_secret: this.appSecret,
            refresh_token: token,
            sign_method: "sha256",
        });
        const res = await http.post(url, data);
        const payload = res.data;
        if (!payload || !payload.access_token) {
            throw new LazadaAuthError({
                code: "REFRESH_FAILED",
                message: "Missing access_token in refresh response",
                details: { payload },
            });
        }
        const newToken = {
            access_token: payload.access_token,
            refresh_token: payload.refresh_token,
            expires_in: Number(payload.expires_in ?? 0),
            account_user_id: payload.account_user_id,
            country: payload.country,
            refresh_expires_in: payload.refresh_expires_in
                ? Number(payload.refresh_expires_in)
                : undefined,
            token_type: payload.token_type,
            expires_at: Date.now() + Number(payload.expires_in ?? 0) * 1000,
        };
        this.accessToken = newToken.access_token;
        this.refreshToken = newToken.refresh_token;
        if (this.tokenStore) {
            await this.tokenStore.set({
                installationId: this.installationId,
                accessToken: newToken.access_token,
                refreshToken: newToken.refresh_token,
                expiresAt: newToken.expires_at ?? Date.now() + newToken.expires_in * 1000,
            });
        }
        return newToken;
    }
    async request(method, apiPath, params = {}, body) {
        if (!apiPath.startsWith("/"))
            throw new LazadaApiError({
                code: "INVALID_PATH",
                message: "apiPath must start with '/'",
            });
        const http = createHttpClient(this.apiBaseUrl, this.timeoutMs);
        const timestamp = Date.now();
        const query = {
            ...params,
            app_key: this.appKey,
            sign_method: "sha256",
            timestamp,
        };
        if (this.accessToken) {
            query.access_token = this.accessToken;
        }
        const signature = generateSignature(this.appSecret, apiPath, query);
        const finalQuery = { ...query, sign: signature };
        if (method === "GET") {
            const res = await http.get(apiPath, { params: finalQuery });
            return res.data;
        }
        const res = await http.post(apiPath, body ?? {}, { params: finalQuery });
        return res.data;
    }
    isTokenExpiredSoon(expiresAtMs) {
        if (!expiresAtMs)
            return false;
        return Date.now() + 60_000 >= expiresAtMs;
    }
    async ensureValidToken() {
        if (!this.tokenStore)
            return;
        await this.tokenStore.init();
        const tokens = await this.tokenStore.get(this.installationId);
        if (!tokens)
            return;
        if (!this.isTokenExpiredSoon(tokens.expiresAt)) {
            this.accessToken = tokens.accessToken;
            this.refreshToken = tokens.refreshToken;
            return;
        }
        const refreshed = await this.refreshAccessToken(tokens.refreshToken);
        await this.tokenStore.set({
            installationId: this.installationId,
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token,
            expiresAt: refreshed.expires_at ?? Date.now() + refreshed.expires_in * 1000,
        });
    }
}
