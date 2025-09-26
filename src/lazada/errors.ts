export interface LazadaErrorOptions {
  code: string;
  message: string;
  requestId?: string;
  details?: Record<string, unknown>;
  status?: number;
}

export class LazadaError extends Error {
  public readonly code: string;
  public readonly requestId?: string;
  public readonly details?: Record<string, unknown>;
  public readonly status?: number;

  constructor(options: LazadaErrorOptions) {
    super(options.message);
    this.name = "LazadaError";
    this.code = options.code;
    this.requestId = options.requestId;
    this.details = options.details;
    this.status = options.status;
  }
}

export class LazadaApiError extends LazadaError {
  constructor(options: LazadaErrorOptions) {
    super({ ...options });
    this.name = "LazadaApiError";
  }
}

export class LazadaAuthError extends LazadaError {
  constructor(options: LazadaErrorOptions) {
    super({ ...options });
    this.name = "LazadaAuthError";
  }
}

export class LazadaNetworkError extends LazadaError {
  constructor(options: LazadaErrorOptions) {
    super({ ...options });
    this.name = "LazadaNetworkError";
  }
}

export function isLazadaError(err: unknown): err is LazadaError {
  if (!err || typeof err !== "object") return false;
  const name = (err as { name?: unknown }).name;
  return typeof name === "string" && name.startsWith("Lazada");
}
