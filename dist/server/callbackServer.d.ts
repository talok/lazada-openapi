import http from "node:http";
import { LazadaClient } from "../lazada/LazadaClient.js";
import type { TokenStore } from "../types.js";
export interface CallbackServerOptions {
    port?: number;
    path?: string;
    installationId?: string;
}
export declare function startCallbackServer(client: LazadaClient, store: TokenStore, options?: CallbackServerOptions): http.Server;
