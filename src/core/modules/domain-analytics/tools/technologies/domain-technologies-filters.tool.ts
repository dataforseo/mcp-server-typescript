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

export class DomainTechnologiesFiltersTool extends BaseTool {
  private static cache: ToolFilters | null = null;
  private static lastFetchTime: number = 0;
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Map of tool names to their corresponding filter paths in the API response
  private static readonly TOOL_TO_FILTER_MAP: { [key: string]: string } = {
    'domain_analytics_technologies_domains_by_technology': 'domains_by_technology',
    'domain_analytics_technologies_aggregation_technologies': 'aggregation_technologies',
    'domain_analytics_technologies_technologies_summary': 'technologies_summary',
    'domain_analytics_technologies_domains_by_html_terms': 'domains_by_html_terms'
  };

  constructor(private client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'domain_analytics_technologies_available_filters';
  }

  getDescription(): string {
    return `Here you will find all the necessary information about filters that can be used with DataForSEO Technologies API endpoints.

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
    if (DomainTechnologiesFiltersTool.cache && 
        (now - DomainTechnologiesFiltersTool.lastFetchTime) < DomainTechnologiesFiltersTool.CACHE_TTL) {
      return DomainTechnologiesFiltersTool.cache;
    }

    // Fetch fresh data
    const response = await this.client.makeRequest('/v3/domain_analytics/technologies/available_filters', 'GET', null, true) as DataForSEOFullResponse;
    this.validateResponseFull(response);

    // Transform the response into our cache format
    const filters: ToolFilters = {};
    const result = response.tasks[0].result[0];

    // Process each tool's filters
    for (const [toolName, filterPath] of Object.entries(DomainTechnologiesFiltersTool.TOOL_TO_FILTER_MAP)) {
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
    DomainTechnologiesFiltersTool.cache = filters;
    DomainTechnologiesFiltersTool.lastFetchTime = now;

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