export class LazadaError extends Error {
    code;
    requestId;
    details;
    status;
    constructor(options) {
        super(options.message);
        this.name = "LazadaError";
        this.code = options.code;
        this.requestId = options.requestId;
        this.details = options.details;
        this.status = options.status;
    }
}
export class LazadaApiError extends LazadaError {
    constructor(options) {
        super({ ...options });
        this.name = "LazadaApiError";
    }
}
export class LazadaAuthError extends LazadaError {
    constructor(options) {
        super({ ...options });
        this.name = "LazadaAuthError";
    }
}
export class LazadaNetworkError extends LazadaError {
    constructor(options) {
        super({ ...options });
        this.name = "LazadaNetworkError";
    }
}
export function isLazadaError(err) {
    if (!err || typeof err !== "object")
        return false;
    const name = err.name;
    return typeof name === "string" && name.startsWith("Lazada");
}
