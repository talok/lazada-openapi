import http from "node:http";
import { URL } from "node:url";
export function startCallbackServer(client, store, options = {}) {
    const port = options.port ?? 8787;
    const path = options.path ?? "/lazada/callback";
    const installationId = options.installationId ?? "default";
    const server = http.createServer(async (req, res) => {
        try {
            if (!req.url) {
                res.statusCode = 400;
                res.end("Bad Request");
                return;
            }
            const url = new URL(req.url, `http://localhost:${port}`);
            if (url.pathname !== path || req.method !== "GET") {
                res.statusCode = 404;
                res.end("Not Found");
                return;
            }
            const code = url.searchParams.get("code");
            if (!code) {
                res.statusCode = 400;
                res.end("Missing code");
                return;
            }
            const tokens = await client.exchangeAuthCode(code);
            await store.set({
                installationId,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: tokens.expires_at ?? Date.now() + tokens.expires_in * 1000,
            });
            res.statusCode = 200;
            res.end("Authorization successful. You may close this window.");
        }
        catch (err) {
            res.statusCode = 500;
            res.end(`Error: ${err?.message ?? "Unknown"}`);
        }
    });
    server.listen(port);
    return server;
}
