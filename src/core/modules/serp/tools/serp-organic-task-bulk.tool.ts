import { z } from 'zod';
import { BaseTool } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';

/**
 * Shape of a DataForSEO task-queue response (task_post / task_get / tasks_ready).
 * We always request the "full" (non-.ai) variant for these so the envelope is predictable.
 */
interface TaskEnvelope {
  status_code: number;
  status_message: string;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    data?: Record<string, any>;
    result?: any[] | null;
  }>;
}

/** A single organic listing, trimmed to the essentials. */
interface OrganicResult {
  rank: number;
  title: string;
  url: string;
  domain: string;
  description: string;
}

/** Per-keyword compact result returned to the caller. */
interface BulkResultItem {
  keyword: string;
  location_name: string;
  language_code: string;
  status: 'ok' | 'pending' | 'error';
  status_message?: string;
  organic: OrganicResult[];
  ai_overview: {
    exists: boolean;
    cited_urls: string[];
  };
}

// DataForSEO task status codes.
const STATUS_OK = 20000;          // task completed, result available
const STATUS_IN_QUEUE = 40602;    // task accepted, still queued
const STATUS_IN_PROGRESS = 40601; // task is being processed

/**
 * Bulk SERP via the DataForSEO task-queue pattern:
 *   1. POST every keyword as a task (task_post, up to 100 per call)
 *   2. Poll each task id (task_get) until complete or max_wait_seconds elapses
 *   3. Strip each result down to organic listings + an AI-Overview signal
 *
 * Standard-priority tasks are far cheaper than the live endpoint but take longer,
 * so this tool polls internally and returns one compact array for all keywords.
 */
export class SerpOrganicTaskBulkTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getName(): string {
    return 'serp_organic_task_bulk';
  }

  getTitle(): string {
    return 'SERP Organic Task – Bulk';
  }

  getDescription(): string {
    return [
      'Fetch Google/Bing/Yahoo organic SERPs for MANY keywords at once using the DataForSEO task queue.',
      'Posts all keywords as tasks, polls until they complete, and returns a compact array:',
      'per keyword the organic results (rank, title, url, domain, description) plus an AI Overview',
      'signal (whether one exists and only its cited URLs). Cheaper than the live endpoint; use this',
      'for batches. Tasks may take up to a couple of minutes; raise max_wait_seconds for large batches.',
    ].join(' ');
  }

  getParams(): z.ZodRawShape {
    return {
      keywords: z
        .array(z.string().min(1))
        .min(1)
        .max(100)
        .describe('List of search keywords to look up (1-100 per call).'),
      search_engine: z
        .string()
        .default('google')
        .describe('Search engine: google, bing, or yahoo.'),
      location_name: z
        .string()
        .default('United States')
        .describe(`Full location name. Hierarchical, comma-separated (most specific first):
1. Country only: "United States"
2. Region,Country: "California,United States"
3. City,Region,Country: "San Francisco,California,United States"`),
      language_code: z.string().describe("Search engine language code (e.g., 'en')."),
      depth: z
        .number()
        .min(10)
        .max(700)
        .default(10)
        .describe('Parsing depth: number of organic results to return.'),
      device: z
        .string()
        .default('desktop')
        .optional()
        .describe('Device type: desktop or mobile.'),
      priority: z
        .number()
        .min(1)
        .max(2)
        .default(1)
        .optional()
        .describe('Task priority: 1 = normal (cheaper, slower), 2 = high.'),
      include_ai_overview: z
        .boolean()
        .default(true)
        .optional()
        .describe('Request AI Overview loading so its cited URLs can be returned.'),
      max_wait_seconds: z
        .number()
        .min(10)
        .max(600)
        .default(180)
        .optional()
        .describe('Maximum total time to poll for task completion before returning partial results.'),
      poll_interval_seconds: z
        .number()
        .min(2)
        .max(60)
        .default(6)
        .optional()
        .describe('Delay between polling rounds.'),
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const engine = params.search_engine || 'google';
      const maxWaitMs = (params.max_wait_seconds ?? 180) * 1000;
      const pollMs = (params.poll_interval_seconds ?? 6) * 1000;
      const base = `/v3/serp/${engine}/organic`;

      // 1. Submit all keywords. tag = index so we can map results back even if
      // keywords are duplicated.
      const taskPostBody = params.keywords.map((keyword: string, index: number) => ({
        keyword,
        location_name: params.location_name,
        language_code: params.language_code,
        depth: params.depth,
        device: params.device,
        priority: params.priority,
        load_async_ai_overview: params.include_ai_overview !== false ? true : undefined,
        tag: String(index),
      }));

      const postResponse = await this.dataForSEOClient.makeRequest<TaskEnvelope>(
        `${base}/task_post`,
        'POST',
        taskPostBody,
        true, // forceFull: predictable envelope
      );

      // Seed one result slot per keyword.
      const results: BulkResultItem[] = params.keywords.map((keyword: string) => ({
        keyword,
        location_name: params.location_name,
        language_code: params.language_code,
        status: 'pending',
        organic: [],
        ai_overview: { exists: false, cited_urls: [] },
      }));

      // Map task id -> keyword index, recording any tasks that failed to post.
      const pending = new Map<string, number>();
      for (const task of postResponse.tasks ?? []) {
        const index = Number(task.data?.tag);
        if (Number.isNaN(index) || index < 0 || index >= results.length) {
          continue;
        }
        if (task.status_code === 20100 /* Task Created */ && task.id) {
          pending.set(task.id, index);
        } else {
          results[index].status = 'error';
          results[index].status_message = `${task.status_message} (${task.status_code})`;
        }
      }

      // 2. Poll each pending task until done or we run out of time.
      const deadline = Date.now() + maxWaitMs;
      while (pending.size > 0 && Date.now() < deadline) {
        await this.sleep(pollMs);

        const ids = Array.from(pending.keys());
        const fetched = await Promise.all(
          ids.map((id) =>
            this.dataForSEOClient
              .makeRequest<TaskEnvelope>(`${base}/task_get/advanced/${id}`, 'GET', undefined, true)
              .then((res) => ({ id, res }))
              .catch((err) => ({ id, err })),
          ),
        );

        for (const entry of fetched) {
          const index = pending.get(entry.id);
          if (index === undefined) continue;

          if ('err' in entry) {
            // Transient fetch error: leave pending so we retry next round.
            continue;
          }

          const task = entry.res.tasks?.[0];
          if (!task) continue;

          if (task.status_code === STATUS_OK) {
            const items = task.result?.[0]?.items ?? [];
            results[index].organic = this.extractOrganic(items, params.depth);
            results[index].ai_overview = this.extractAiOverview(items);
            results[index].status = 'ok';
            pending.delete(entry.id);
          } else if (
            task.status_code === STATUS_IN_QUEUE ||
            task.status_code === STATUS_IN_PROGRESS
          ) {
            // still cooking — keep polling
          } else {
            results[index].status = 'error';
            results[index].status_message = `${task.status_message} (${task.status_code})`;
            pending.delete(entry.id);
          }
        }
      }

      // Any tasks still pending hit the timeout; report them as pending so the
      // caller can re-poll if needed.
      for (const index of pending.values()) {
        results[index].status_message =
          'Timed out waiting for task completion; increase max_wait_seconds and retry.';
      }

      const summary = {
        keywords_requested: results.length,
        completed: results.filter((r) => r.status === 'ok').length,
        pending: results.filter((r) => r.status === 'pending').length,
        errored: results.filter((r) => r.status === 'error').length,
        results,
      };

      // formatResponse keeps the field-config pipeline working without re-running
      // the full/.ai validators (which expect the live-endpoint envelope).
      return this.formatResponse(summary);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /** Keep only organic listings, trimmed to the essentials. */
  private extractOrganic(items: any[], depth?: number): OrganicResult[] {
    const organic = items
      .filter((item) => item?.type === 'organic')
      .map((item) => ({
        rank: item.rank_absolute ?? item.rank_group,
        title: item.title ?? '',
        url: item.url ?? '',
        domain: item.domain ?? '',
        description: item.description ?? '',
      }));
    return depth ? organic.slice(0, depth) : organic;
  }

  /**
   * Detect an AI Overview element and collect only its cited URLs.
   * DataForSEO exposes citations under `references[]` and sometimes inline
   * `items[].links[]`, so we gather every url found within the element.
   */
  private extractAiOverview(items: any[]): { exists: boolean; cited_urls: string[] } {
    const element = items.find((item) => item?.type === 'ai_overview');
    if (!element) {
      return { exists: false, cited_urls: [] };
    }
    const urls = new Set<string>();
    this.collectUrls(element, urls);
    return { exists: true, cited_urls: Array.from(urls) };
  }

  /** Recursively pull every non-empty string `url` field out of an object. */
  private collectUrls(node: any, out: Set<string>): void {
    if (Array.isArray(node)) {
      for (const child of node) this.collectUrls(child, out);
    } else if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        if (key === 'url' && typeof value === 'string' && value) {
          out.add(value);
        } else {
          this.collectUrls(value, out);
        }
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
