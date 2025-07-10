import { z } from 'zod';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';
import { BaseTool, DataForSEOFullResponse } from '../../base.tool.js';

interface FilterField {
  type: string;
  path: string;
}

interface ToolFilters {
  [key: string]: {
    [field: string]: string;
  };
}

export class BacklinksFiltersTool extends BaseTool {
  private static cache: ToolFilters | null = null;
  private static lastFetchTime: number = 0;
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Map of tool names to their corresponding filter paths in the API response
  private static readonly TOOL_TO_FILTER_MAP: { [key: string]: string } = {
    'backlinks_content_duplicates': 'content_duplicates',
    'backlinks_backlinks': 'backlinks',
    'backlinks_domain_pages': 'domain_pages',
    'backlinks_anchors': 'anchors',
    'backlinks_referring_domains': 'referring_domains',
    'backlinks_domain_intersection': 'domain_intersection',
    'backlinks_page_intersection': 'page_intersection',
    'backlinks_referring_networks': 'referring_networks',
    'backlinks_domain_pages_summary': 'domain_pages_summary',
    'backlinks_competitors': 'competitors'
  };

  constructor(private client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'backlinks_available_filters';
  }

  getDescription(): string {
    return `Here you will find all the necessary information about filters that can be used with DataForSEO Backlinks API endpoints.

Please, keep in mind that filters are associated with a certain object in the result array, and should be specified accordingly.`;
  }

  protected supportOnlyFullResponse(): boolean {
    return true;
  }

  getParams(): z.ZodRawShape {
    return {
      tool: z.string().optional().describe('The name of the tool to get filters for')
    };
  }

  private async fetchAndCacheFilters(): Promise<ToolFilters> {
    const now = Date.now();
    
    // Return cached data if it's still valid
    if (BacklinksFiltersTool.cache && 
        (now - BacklinksFiltersTool.lastFetchTime) < BacklinksFiltersTool.CACHE_TTL) {
      return BacklinksFiltersTool.cache;
    }

    // Fetch fresh data
    const response = await this.client.makeRequest('/v3/backlinks/available_filters', 'GET', null, true) as DataForSEOFullResponse;
    this.validateResponseFull(response);

    // Transform the response into our cache format
    const filters: ToolFilters = {};
    const result = response.tasks[0].result[0];

    // Process each tool's filters
    for (const [toolName, filterPath] of Object.entries(BacklinksFiltersTool.TOOL_TO_FILTER_MAP)) {
      const pathParts = filterPath.split('.');
      let current = result;
      
      // Navigate to the correct filter object
      for (const part of pathParts) {
        if (current && current[part]) {
          current = current[part];
        } else {
          current = null;
          break;
        }
      }

      if (current) {
        filters[toolName] = current;
      }
    }

    // Update cache
    BacklinksFiltersTool.cache = filters;
    BacklinksFiltersTool.lastFetchTime = now;

    return filters;
  }

  async handle(params: any): Promise<any> {
    try {
      const filters = await this.fetchAndCacheFilters();
      
      if (!params.tool) {
        return this.formatResponse(filters);
      }

      const toolFilters = filters[params.tool];
      if (!toolFilters) {
        throw new Error(`No filters found for tool: ${params.tool}`);
      }

      return this.formatResponse(toolFilters);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 