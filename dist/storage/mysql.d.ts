import type { StoredTokens, TokenStore } from "../types.js";
export interface MySqlTokenStoreOptions {
    uri?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    tableName?: string;
}
export declare class MySqlTokenStore implements TokenStore {
    private readonly options;
    private pool?;
    constructor(options: MySqlTokenStoreOptions);
    init(): Promise<void>;
    private ensurePool;
    get(installationId: string): Promise<StoredTokens | null>;
    set(tokens: StoredTokens): Promise<void>;
    clear(installationId: string): Promise<void>;
}
