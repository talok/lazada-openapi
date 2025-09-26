export type LazadaRegion =
  | "global" // defaults to api.lazada.com/auth.lazada.com
  | "sg"
  | "my"
  | "ph"
  | "th"
  | "vn"
  | "id";

export type HttpMethod = "GET" | "POST";

export interface LazadaClientOptions {
  appKey: string;
  appSecret: string;
  redirectUri?: string;
  accessToken?: string;
  refreshToken?: string;
  region?: LazadaRegion;
  timeoutMs?: number;
  baseApiUrlOverride?: string; // advanced
  baseAuthUrlOverride?: string; // advanced
  tokenStore?: TokenStore; // optional persistence
  installationId?: string; // key for multi-tenant token storage, defaults to "default"
}

export type LazadaRequestParams = Record<
  string,
  string | number | boolean | undefined | null
>;

export interface LazadaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  account_user_id?: string;
  country?: string;
  refresh_expires_in?: number;
  token_type?: string;
  expires_at?: number; // computed client-side now+expires_in*1000
}

export interface StoredTokens {
  installationId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
  meta?: Record<string, unknown>;
}

export interface TokenStore {
  init(): Promise<void>;
  get(installationId: string): Promise<StoredTokens | null>;
  set(tokens: StoredTokens): Promise<void>;
  clear(installationId: string): Promise<void>;
}
