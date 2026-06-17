import { defaultGlobalToolConfig } from '../config/global.tool.js';
import { version } from '../utils/version.js';

// HTTP resilience defaults. Overridable via DataForSEOConfig for tests/advanced use.
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_INITIAL_BACKOFF_MS = 500;
const DEFAULT_MAX_BACKOFF_MS = 8_000;

// Status codes that are safe to retry (transient).
const RETRYABLE_STATUS_CODES = new Set([429, 503]);

/**
 * Error thrown for non-2xx HTTP responses from the DataForSEO API.
 *
 * Carries the HTTP status so callers (and the retry loop) can distinguish
 * transient failures (429/503) from permanent client errors (other 4xx).
 */
export class DataForSEOHttpError extends Error {
  public readonly status: number;
  public readonly retryable: boolean;

  constructor(status: number, message?: string) {
    super(message ?? `HTTP error! status: ${status}`);
    this.name = 'DataForSEOHttpError';
    this.status = status;
    this.retryable = isRetryableStatus(status);
  }
}

function isRetryableStatus(status: number): boolean {
  if (RETRYABLE_STATUS_CODES.has(status)) {
    return true;
  }
  // Retry on 5xx server errors generally; never retry other 4xx (permanent).
  if (status >= 500 && status <= 599) {
    return true;
  }
  return false;
}

/**
 * Determine whether a thrown error from the request attempt is transient and
 * therefore worth retrying. Covers our typed HTTP errors, AbortError (timeout),
 * and low-level network/fetch failures (e.g. ECONNRESET, DNS, TLS).
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof DataForSEOHttpError) {
    return error.retryable;
  }
  if (error instanceof Error) {
    // AbortController fires AbortError on timeout -> transient.
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return true;
    }
    // node-fetch / undici wrap network failures in a TypeError ("fetch failed")
    // and expose the underlying cause with a code like ECONNRESET / ETIMEDOUT.
    const code = (error as { code?: string }).code;
    if (code) {
      return true;
    }
    const cause = (error as { cause?: { code?: string } }).cause;
    if (cause && typeof cause.code === 'string') {
      return true;
    }
    // Native fetch throws a TypeError for network-level failures.
    if (error instanceof TypeError) {
      return true;
    }
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Full jitter exponential backoff, capped at maxBackoffMs. */
function computeBackoff(attempt: number, initial: number, max: number): number {
  const exponential = Math.min(max, initial * 2 ** attempt);
  return Math.floor(Math.random() * exponential);
}

export class DataForSEOClient {
  private config: DataForSEOConfig;
  private userAgent: string;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  private readonly initialBackoffMs: number;
  private readonly maxBackoffMs: number;

  constructor(config: DataForSEOConfig) {
    this.config = config;
    if (defaultGlobalToolConfig.debug) {
      console.error('DataForSEOClient initialized with config:', config);
    }
    this.userAgent = `DataForSEO-MCP-TypeScript-SDK/${version}`;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.initialBackoffMs = config.initialBackoffMs ?? DEFAULT_INITIAL_BACKOFF_MS;
    this.maxBackoffMs = config.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS;
  }

  /**
   * Perform a single fetch attempt with a hard timeout via AbortController.
   * Throws DataForSEOHttpError on non-2xx, AbortError on timeout, and
   * propagates network errors as-is.
   */
  private async fetchOnce(url: string, method: string, body?: any): Promise<Response> {
    const headers = {
      'Authorization': this.config.authHeader,
      'Content-Type': 'application/json',
      'User-Agent': this.userAgent,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new DataForSEOHttpError(response.status);
      }
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  async makeRequest<T>(endpoint: string, method: string = 'POST', body?: any, forceFull: boolean = false): Promise<T> {
    let url = `${this.config.baseUrl || "https://api.dataforseo.com"}${endpoint}`;
    if (!defaultGlobalToolConfig.fullResponse && !forceFull) {
      url += '.ai';
    }

    if (defaultGlobalToolConfig.debug) {
      console.error(`Making request to ${url} with method ${method} and body`, body);
    }

    let lastError: unknown;
    // Total attempts = 1 initial + maxRetries.
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.fetchOnce(url, method, body);
        return (await response.json()) as T;
      } catch (error) {
        lastError = error;

        const retryable = isRetryableError(error);
        const hasAttemptsLeft = attempt < this.maxRetries;

        if (!retryable || !hasAttemptsLeft) {
          throw error;
        }

        const delay = computeBackoff(attempt, this.initialBackoffMs, this.maxBackoffMs);
        if (defaultGlobalToolConfig.debug) {
          const reason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
          console.error(
            `Request to ${url} failed (attempt ${attempt + 1}/${this.maxRetries + 1}): ${reason}. Retrying in ${delay}ms.`
          );
        }
        await sleep(delay);
      }
    }

    // Unreachable in practice; loop either returns or throws.
    throw lastError;
  }
}

export interface DataForSEOConfig {
  authHeader: string;
  baseUrl?: string;
  /** Max retry attempts after the initial request. Default 3. */
  maxRetries?: number;
  /** Per-attempt timeout in milliseconds. Default 30000. */
  timeoutMs?: number;
  /** Initial backoff in milliseconds (full-jitter exponential). Default 500. */
  initialBackoffMs?: number;
  /** Backoff cap in milliseconds. Default 8000. */
  maxBackoffMs?: number;
}

export function buildBasicAuthHeader(username: string, password: string): string {
  return `Basic ${btoa(`${username}:${password}`)}`;
}
