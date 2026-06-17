import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DataForSEOClient,
  buildBasicAuthHeader,
} from '../src/core/client/dataforseo.client.js';
import { SerpOrganicLiveAdvancedTool } from '../src/core/modules/serp/tools/serp-organic-live-advanced.tool.js';
import { WhoisOverviewTool } from '../src/core/modules/domain-analytics/tools/whois/whois-overview.tool.js';
import { GoogleDomainRankOverviewTool } from '../src/core/modules/dataforseo-labs/tools/google/competitor-research/google-domain-rank-overview.tool.js';
import { DataForSeoLabsFilterTool } from '../src/core/modules/dataforseo-labs/tools/labs-filters.tool.js';

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

// Short-response (".ai") shape consumed by validateResponse(): top-level
// status_code/items.
function shortOk(items: unknown[]) {
  return {
    id: 'task-id',
    status_code: 20000,
    status_message: 'Ok.',
    items,
  };
}

// Full-response shape consumed by validateResponseFull(): top-level + tasks[].
function fullOk(result: unknown[]) {
  return {
    version: '0.1.0',
    status_code: 20000,
    status_message: 'Ok.',
    time: '0.1 sec',
    cost: 0.01,
    tasks_count: 1,
    tasks_error: 0,
    tasks: [
      {
        id: 'task-id',
        status_code: 20000,
        status_message: 'Ok.',
        time: '0.1 sec',
        cost: 0.01,
        result_count: 1,
        path: [],
        data: {},
        result,
      },
    ],
  };
}

function parseToolText(res: { content: Array<{ type: string; text: string }> }) {
  return res.content[0].text;
}

let fetchMock: ReturnType<typeof vi.fn>;

function newClient() {
  return new DataForSEOClient({
    authHeader: buildBasicAuthHeader('user', 'pass'),
    baseUrl: 'https://api.test',
    initialBackoffMs: 1,
    maxBackoffMs: 2,
  });
}

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  // Silence the tools' console.error param dumps.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('SerpOrganicLiveAdvancedTool', () => {
  it('parses a successful short response into formatted tool content', async () => {
    const items = [{ type: 'organic', title: 'Example', url: 'https://example.com' }];
    fetchMock.mockResolvedValueOnce(jsonResponse(shortOk(items)));

    const tool = new SerpOrganicLiveAdvancedTool(newClient());
    const res = await tool.handle({
      search_engine: 'google',
      location_name: 'United States',
      language_code: 'en',
      keyword: 'pizza',
      depth: 10,
    });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/v3/serp/google/organic/live/advanced.ai');
    expect(parseToolText(res)).toContain('Example');
    expect(JSON.parse(parseToolText(res))).toEqual(shortOk(items));
  });

  it('surfaces an API-level error (non-200 status_code) as a formatted error response', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 'x', status_code: 40400, status_message: 'Not Found.', items: [] })
    );

    const tool = new SerpOrganicLiveAdvancedTool(newClient());
    const res = await tool.handle({
      search_engine: 'google',
      location_name: 'United States',
      language_code: 'en',
      keyword: 'pizza',
      depth: 10,
    });

    expect(parseToolText(res)).toMatch(/^Error: API Error: Not Found\. \(Code: 40400\)$/);
  });

  it('surfaces a transient HTTP failure as an error after retries are exhausted', async () => {
    fetchMock.mockResolvedValue(httpResponse(503));

    const tool = new SerpOrganicLiveAdvancedTool(newClient());
    const res = await tool.handle({
      search_engine: 'google',
      location_name: 'United States',
      language_code: 'en',
      keyword: 'pizza',
      depth: 10,
    });

    // 1 + 3 retries.
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(parseToolText(res)).toContain('Error:');
    expect(parseToolText(res)).toContain('503');
  });
});

describe('GoogleDomainRankOverviewTool', () => {
  it('retries a 429 then parses the eventual success', async () => {
    const items = [{ metrics: { organic: { count: 42 } } }];
    fetchMock
      .mockResolvedValueOnce(httpResponse(429))
      .mockResolvedValueOnce(jsonResponse(shortOk(items)));

    const tool = new GoogleDomainRankOverviewTool(newClient());
    const res = await tool.handle({
      target: 'example.com',
      location_name: 'United States',
      language_code: 'en',
      ignore_synonyms: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/v3/dataforseo_labs/google/domain_rank_overview/live.ai');
    expect(JSON.parse(init.body)).toEqual([
      {
        target: 'example.com',
        location_name: 'United States',
        language_code: 'en',
        ignore_synonyms: true,
      },
    ]);
    expect(JSON.parse(parseToolText(res))).toEqual(shortOk(items));
  });
});

describe('WhoisOverviewTool (short-response path)', () => {
  it('parses a successful short response into formatted tool content', async () => {
    const items = [{ domain: 'example.com', backlinks: 100 }];
    fetchMock.mockResolvedValueOnce(jsonResponse(shortOk(items)));

    const tool = new WhoisOverviewTool(newClient());
    const res = await tool.handle({ limit: 10, is_claimed: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/v3/domain_analytics/whois/overview/live.ai');
    // null filters/order_by are passed through by formatFilters/formatOrderBy.
    expect(JSON.parse(init.body)).toEqual([
      { limit: 10, offset: undefined, filters: null, order_by: null },
    ]);
    expect(JSON.parse(parseToolText(res))).toEqual(shortOk(items));
  });

  it('surfaces an API-level error as a formatted error response', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 'x', status_code: 40100, status_message: 'Auth error.', items: [] })
    );

    const tool = new WhoisOverviewTool(newClient());
    const res = await tool.handle({ limit: 10, is_claimed: true });

    expect(parseToolText(res)).toContain('Error: API Error: Auth error. (Code: 40100)');
  });
});

describe('DataForSeoLabsFilterTool (full-response path, GET + forceFull)', () => {
  beforeEach(() => {
    // The tool caches filters on a static field; reset it so each test
    // performs a real (mocked) request.
    (DataForSeoLabsFilterTool as unknown as { cache: unknown }).cache = null;
    (DataForSeoLabsFilterTool as unknown as { lastFetchTime: number }).lastFetchTime = 0;
  });

  it('issues a GET to the full (non-.ai) endpoint and unwraps tasks[0].result[0]', async () => {
    const apiResult = [
      {
        'domain_rank_overview': { google: { 'metrics.organic.count': '<value>' } },
      },
    ];
    fetchMock.mockResolvedValueOnce(jsonResponse(fullOk(apiResult)));

    const tool = new DataForSeoLabsFilterTool(newClient());
    const res = await tool.handle({ tool: 'dataforseo_labs_google_domain_rank_overview' });

    const [url, init] = fetchMock.mock.calls[0];
    // forceFull=true => no ".ai" suffix; method is GET.
    expect(url).toBe('https://api.test/v3/dataforseo_labs/available_filters');
    expect(init.method).toBe('GET');
    expect(JSON.parse(parseToolText(res))).toEqual({
      'metrics.organic.count': '<value>',
    });
  });

  it('raises a task-level error when a task fails', async () => {
    const bad = fullOk([]);
    bad.tasks_error = 1;
    bad.tasks[0].status_code = 40000;
    bad.tasks[0].status_message = 'Bad task.';
    fetchMock.mockResolvedValueOnce(jsonResponse(bad));

    const tool = new DataForSeoLabsFilterTool(newClient());
    const res = await tool.handle({});

    expect(parseToolText(res)).toContain('Error:');
    expect(parseToolText(res)).toContain('40000');
  });
});
