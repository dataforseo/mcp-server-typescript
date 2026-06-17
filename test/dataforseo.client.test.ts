import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DataForSEOClient,
  DataForSEOHttpError,
  buildBasicAuthHeader,
} from '../src/core/client/dataforseo.client.js';

// A minimal Response-like stub good enough for the client (it only calls .ok,
// .status and .json()).
function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function httpResponse(status: number): Response {
  return {
    ok: false,
    status,
    json: async () => ({}),
  } as unknown as Response;
}

const OK_BODY = { status_code: 20000, status_message: 'Ok.', tasks: [] };

let fetchMock: ReturnType<typeof vi.fn>;

function newClient(overrides: Record<string, unknown> = {}) {
  return new DataForSEOClient({
    authHeader: buildBasicAuthHeader('user', 'pass'),
    baseUrl: 'https://api.test',
    // Keep tests fast: tiny backoff so retries do not actually wait.
    initialBackoffMs: 1,
    maxBackoffMs: 2,
    ...overrides,
  });
}

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('DataForSEOClient.makeRequest - success', () => {
  it('returns parsed JSON on first-try success', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(OK_BODY));
    const client = newClient();

    const result = await client.makeRequest('/v3/serp/google/organic/live/advanced');

    expect(result).toEqual(OK_BODY);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('appends .ai to the endpoint (default short-response mode) and sets auth + UA headers', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(OK_BODY));
    const client = newClient();

    await client.makeRequest('/v3/dataforseo_labs/google/domain_rank_overview/live', 'POST', [
      { target: 'example.com' },
    ]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/v3/dataforseo_labs/google/domain_rank_overview/live.ai');
    expect(init.method).toBe('POST');
    expect(init.headers['Authorization']).toBe(buildBasicAuthHeader('user', 'pass'));
    expect(init.headers['User-Agent']).toMatch(/^DataForSEO-MCP-TypeScript-SDK\//);
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify([{ target: 'example.com' }]));
    // AbortController signal must be attached for the timeout to work.
    expect(init.signal).toBeDefined();
  });

  it('does NOT append .ai when forceFull is true', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(OK_BODY));
    const client = newClient();

    await client.makeRequest('/v3/domain_analytics/whois/overview/live', 'POST', undefined, true);

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/v3/domain_analytics/whois/overview/live');
  });
});

describe('DataForSEOClient.makeRequest - error classification', () => {
  it('does NOT retry permanent 4xx (e.g. 401) and throws DataForSEOHttpError', async () => {
    fetchMock.mockResolvedValue(httpResponse(401));
    const client = newClient();

    await expect(client.makeRequest('/v3/whatever')).rejects.toMatchObject({
      name: 'DataForSEOHttpError',
      status: 401,
      retryable: false,
    });
    // Permanent error => exactly one attempt, no retries.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry a 400 bad request', async () => {
    fetchMock.mockResolvedValue(httpResponse(400));
    const client = newClient();

    await expect(client.makeRequest('/v3/whatever')).rejects.toBeInstanceOf(DataForSEOHttpError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('DataForSEOClient.makeRequest - retry path', () => {
  it('retries on 429 then succeeds', async () => {
    fetchMock
      .mockResolvedValueOnce(httpResponse(429))
      .mockResolvedValueOnce(jsonResponse(OK_BODY));
    const client = newClient();

    const result = await client.makeRequest('/v3/serp/google/organic/live/advanced');

    expect(result).toEqual(OK_BODY);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries on 503 then succeeds', async () => {
    fetchMock
      .mockResolvedValueOnce(httpResponse(503))
      .mockResolvedValueOnce(jsonResponse(OK_BODY));
    const client = newClient();

    const result = await client.makeRequest('/v3/serp/google/organic/live/advanced');

    expect(result).toEqual(OK_BODY);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries on a network error (TypeError: fetch failed) then succeeds', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(jsonResponse(OK_BODY));
    const client = newClient();

    const result = await client.makeRequest('/v3/serp/google/organic/live/advanced');

    expect(result).toEqual(OK_BODY);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries on a network error carrying a code (e.g. ECONNRESET) then succeeds', async () => {
    const netErr = Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' });
    fetchMock
      .mockRejectedValueOnce(netErr)
      .mockResolvedValueOnce(jsonResponse(OK_BODY));
    const client = newClient();

    const result = await client.makeRequest('/v3/serp/google/organic/live/advanced');

    expect(result).toEqual(OK_BODY);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after maxRetries and throws the last error (4 total attempts with default maxRetries=3)', async () => {
    fetchMock.mockResolvedValue(httpResponse(503));
    const client = newClient(); // default maxRetries = 3

    await expect(client.makeRequest('/v3/serp/google/organic/live/advanced')).rejects.toMatchObject({
      status: 503,
    });
    // 1 initial + 3 retries = 4 attempts.
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('honours a custom maxRetries setting', async () => {
    fetchMock.mockResolvedValue(httpResponse(429));
    const client = newClient({ maxRetries: 1 });

    await expect(client.makeRequest('/v3/serp/google/organic/live/advanced')).rejects.toMatchObject({
      status: 429,
    });
    // 1 initial + 1 retry = 2 attempts.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('DataForSEOClient.makeRequest - timeout', () => {
  it('aborts a slow request after timeoutMs and treats the abort as retryable', async () => {
    vi.useFakeTimers();

    // First attempt: a fetch that rejects with AbortError when the signal fires.
    fetchMock.mockImplementationOnce((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        const signal = init.signal!;
        signal.addEventListener('abort', () => {
          reject(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }));
        });
      });
    });
    // Second attempt (after the abort-triggered retry): succeed immediately.
    fetchMock.mockResolvedValueOnce(jsonResponse(OK_BODY));

    const client = newClient({ timeoutMs: 1000 });
    const promise = client.makeRequest('/v3/serp/google/organic/live/advanced');

    // Advance past the timeout to trigger the AbortController, then drain the
    // backoff timer so the retry runs.
    await vi.advanceTimersByTimeAsync(1000); // fire the abort
    await vi.advanceTimersByTimeAsync(10); // fire the (tiny) backoff sleep

    const result = await promise;
    expect(result).toEqual(OK_BODY);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('propagates a timeout as an error when no attempts remain', async () => {
    vi.useFakeTimers();

    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        const signal = init.signal!;
        signal.addEventListener('abort', () => {
          reject(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }));
        });
      });
    });

    const client = newClient({ timeoutMs: 1000, maxRetries: 0 });
    const promise = client.makeRequest('/v3/serp/google/organic/live/advanced');
    // Attach rejection handler before advancing timers to avoid unhandled rejection.
    const assertion = expect(promise).rejects.toMatchObject({ name: 'AbortError' });

    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
