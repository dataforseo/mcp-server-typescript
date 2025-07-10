import { z } from 'zod';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';
import { BaseTool, DataForSEOFullResponse } from '../../base.tool.js';

interface FilterField {
  type: string;
  path: string;
}

interface ToolFilters {
  [key: string]: {
    [engine: string]: {
      [field: string]: string;
    };
  };
}

export class DataForSeoLabsFilterTool extends BaseTool {
  private static cache: ToolFilters | null = null;
  private static lastFetchTime: number = 0;
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Map of tool names to their corresponding filter paths in the API response
  private static readonly TOOL_TO_FILTER_MAP: { [key: string]: string } = {
    'dataforseo_labs_google_ranked_keywords': 'ranked_keywords.google',
    'dataforseo_labs_google_keyword_ideas': 'keyword_ideas.google',
    'dataforseo_labs_google_keywords_for_site': 'keywords_for_site.google',
    'dataforseo_labs_google_competitors_domain': 'competitors_domain.google',
    'dataforseo_labs_google_serp_competitors': 'serp_competitors.google',
    'dataforseo_labs_google_subdomains': 'subdomains.google',
    'dataforseo_labs_google_domain_intersection': 'domain_intersection.google',
    'dataforseo_labs_google_page_intersection': 'page_intersection.google',
    'dataforseo_labs_google_historical_serp': 'historical_serp.google',
    'dataforseo_labs_google_historical_rank_overview': 'domain_rank_overview.google',
    'dataforseo_labs_google_relevant_pages': 'relevant_pages.google',
    'dataforseo_labs_google_top_searches': 'top_searches.google',
    'dataforseo_labs_google_keyword_overview': 'keyword_overview.google',
    'dataforseo_labs_google_search_intent': 'search_intent.google',
    'dataforseo_labs_google_bulk_keyword_difficulty': 'bulk_keyword_difficulty.google',
    'dataforseo_labs_google_related_keywords': 'related_keywords.google',
    'dataforseo_labs_google_keyword_suggestions': 'keyword_suggestions.google',
    'dataforseo_labs_google_domain_rank_overview': 'domain_rank_overview.google',
    'dataforseo_labs_google_domain_metrics_by_categories': 'domain_metrics_by_categories.google',
    'dataforseo_labs_google_domain_whois_overview': 'domain_whois_overview.google',
    'dataforseo_labs_google_categories_for_domain': 'categories_for_domain.google',
    'dataforseo_labs_google_keywords_for_categories': 'keywords_for_categories.google',
    'dataforseo_labs_amazon_product_competitors': 'product_competitors.amazon',
    'dataforseo_labs_amazon_product_keyword_intersections': 'product_keyword_intersections.amazon',
    'dataforseo_labs_google_app_competitors': 'app_competitors.google',
    'dataforseo_labs_apple_app_competitors': 'app_competitors.apple',
    'dataforseo_labs_google_app_intersection': 'app_intersection.google',
    'dataforseo_labs_apple_app_intersection': 'app_intersection.apple',
    'dataforseo_labs_google_keywords_for_app': 'keywords_for_app.google',
    'dataforseo_labs_apple_keywords_for_app': 'keywords_for_app.apple',
    'dataforseo_labs_database_rows_count': 'database_rows_count'
  };

  constructor(private client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'dataforseo_labs_available_filters';
  }

  getDescription(): string {
    return `Here you will find all the necessary information about filters that can be used with DataForSEO Labs API endpoints.

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
    if (DataForSeoLabsFilterTool.cache && 
        (now - DataForSeoLabsFilterTool.lastFetchTime) < DataForSeoLabsFilterTool.CACHE_TTL) {
      return DataForSeoLabsFilterTool.cache;
    }

    // Fetch fresh data
    const response = await this.client.makeRequest('/v3/dataforseo_labs/available_filters', 'GET', null, true) as DataForSEOFullResponse;
    this.validateResponseFull(response);

    // Transform the response into our cache format
    const filters: ToolFilters = {};
    const result = response.tasks[0].result[0];

    // Process each tool's filters
    for (const [toolName, filterPath] of Object.entries(DataForSeoLabsFilterTool.TOOL_TO_FILTER_MAP)) {
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
    DataForSeoLabsFilterTool.cache = filters;
    DataForSeoLabsFilterTool.lastFetchTime = now;

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