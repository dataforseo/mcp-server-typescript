import { z } from 'zod';
import { BaseTool } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';

export class SerpOrganicLiveAdvancedToolContent extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getName(): string {
    return 'serp_organic_live_advanced-content';
  }

  getDescription(): string {
    return 'Get organic content search results for a keyword in specified search engine. Excludes products and other irrelevant listings which reduces returned JSON';
  }

  getTitle(): string {
    return 'SERP Organic Live Advanced – Content';
  }

  getParams(): z.ZodRawShape {
    return {
      search_engine: z.string().default('google').describe("search engine name: google, yahoo, bing."),
      location_name: z.string().default('United States').describe("full name of the location"),
      depth: z.number().min(10).max(700).default(10).describe("parsing depth"),
      language_code: z.string().describe("search engine language code (e.g., 'en')"),
      keyword: z.string().describe("Search keyword"),
      max_crawl_pages: z.number().min(1).max(7).optional().default(1).describe("page crawl limit"),
      device: z.string().default('desktop').optional().describe("device type: desktop, mobile"),
      people_also_ask_click_depth: z.number().min(1).max(4).optional().describe("click depth for PAA")
    };
  }

  /**
   * Recursive filter to remove specific types from the DataForSEO response
   */
  private filterResponse(obj: any): any {
    const unwantedTypes = ['product_considerations_element', 'popular_products', 'perspectives'];

    if (Array.isArray(obj)) {
      return obj
        .filter(item => !unwantedTypes.includes(item?.type))
        .map(item => this.filterResponse(item));
    } else if (typeof obj === 'object' && obj !== null) {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, this.filterResponse(value)])
      );
    }
    return obj;
  }

  async handle(params: any): Promise<any> {
    try {
      console.error("DEBUG: Sending request params:", JSON.stringify(params, null, 2));
      
      const response = await this.dataForSEOClient.makeRequest(
        `/v3/serp/${params.search_engine}/organic/live/advanced`, 
        'POST', 
        [{
          location_name: params.location_name,
          language_code: params.language_code,
          group_organic_results: true,
          keyword: params.keyword,
          depth: params.depth,
          max_crawl_pages: params.max_crawl_pages,
          device: params.device,
          people_also_ask_click_depth: params.people_also_ask_click_depth && params.people_also_ask_click_depth > 0 
            ? params.people_also_ask_click_depth 
            : undefined,
        }]
      );

      // Clean the raw response before processing
      const cleanedResponse = this.filterResponse(response);
      
      return this.validateAndFormatResponse(cleanedResponse);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
}