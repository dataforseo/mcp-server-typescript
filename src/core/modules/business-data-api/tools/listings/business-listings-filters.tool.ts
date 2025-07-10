import { z } from 'zod';
import { DataForSEOClient } from '../../../../client/dataforseo.client.js';
import { BaseTool, DataForSEOFullResponse } from '../../../base.tool.js';

interface FilterField {
  type: string;
  path: string;
}

interface ToolFilters {
  [key: string]: {
    [field: string]: string;
  };
}

export class BusinessListingsFiltersTool extends BaseTool {
  private static cache: ToolFilters | null = null;
  private static lastFetchTime: number = 0;
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Map of tool names to their corresponding filter paths in the API response
  private static readonly TOOL_TO_FILTER_MAP: { [key: string]: string } = {
    'business_data_business_listings_search': 'search',
    'business_data_business_listings_categories_aggregation': 'categories_aggregation'
  };

  constructor(private client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'business_data_business_listings_filters';
  }

  getDescription(): string {
    return `Here you will find all the necessary information about filters that can be used with Business Data API business listings endpoints.

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
    if (BusinessListingsFiltersTool.cache && 
        (now - BusinessListingsFiltersTool.lastFetchTime) < BusinessListingsFiltersTool.CACHE_TTL) {
      return BusinessListingsFiltersTool.cache;
    }

    // Fetch fresh data
    const response = await this.client.makeRequest('/v3/business_data/business_listings/available_filters', 'GET', null, true) as DataForSEOFullResponse;
    this.validateResponseFull(response);

    // Transform the response into our cache format
    const filters: ToolFilters = {};
    const result = response.tasks[0].result[0];

    // Process each tool's filters
    for (const [toolName, filterPath] of Object.entries(BusinessListingsFiltersTool.TOOL_TO_FILTER_MAP)) {
      if (result && result[filterPath]) {
        filters[toolName] = result[filterPath];
      }
    }

    // Update cache
    BusinessListingsFiltersTool.cache = filters;
    BusinessListingsFiltersTool.lastFetchTime = now;
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