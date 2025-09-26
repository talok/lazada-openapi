import axios from "axios";
import { LazadaNetworkError, LazadaApiError } from "./errors.js";
export function createHttpClient(baseURL, timeoutMs) {
    const client = axios.create({ baseURL, timeout: timeoutMs });
    client.interceptors.response.use((res) => res, (err) => {
        if (err.response) {
            const status = err.response.status;
            const data = err.response.data;
            const code = (data && (data.code || data.error || data.error_code)) ||
                String(status);
            const message = (data && (data.message || data.error_description || data.detail)) ||
                err.message;
            throw new LazadaApiError({ code, message, status, details: { data } });
        }
        if (err.request) {
            throw new LazadaNetworkError({
                code: "NETWORK_ERROR",
                message: err.message,
            });
        }
        throw new LazadaNetworkError({
            code: "UNKNOWN_ERROR",
            message: err.message,
        });
    });
    return client;
}
