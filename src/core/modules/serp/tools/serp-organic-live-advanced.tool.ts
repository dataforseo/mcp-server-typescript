import { z } from 'zod';
import { BaseTool } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';

export class SerpOrganicLiveAdvancedTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getName(): string {
    return 'serp_organic_live_advanced';
  }

  getDescription(): string {
    return 'Get organic search results for a keyword in specified search engine';
  }

  getParams(): z.ZodRawShape {
    return {
      search_engine: z.string().default('google').describe("search engine name, one of: google, yahoo, bing."),
      location_name: z.string().default('United States').describe(`full name of the location
required field
Location format - hierarchical, comma-separated (from most specific to least)
 Can be one of:
 1. Country only: "United States"
 2. Region,Country: "California,United States"
 3. City,Region,Country: "San Francisco,California,United States"`),
      depth: z.number().min(10).max(700).default(10).describe(`parsing depth
optional field
number of results in SERP`),
      language_code: z.string().describe("search engine language code (e.g., 'en')"),
      keyword: z.string().describe("Search keyword"),
      max_crawl_pages: z.number().min(1).max(7).optional().default(1).describe(`page crawl limit
optional field
number of search results pages to crawl
max value: 100
Note: the max_crawl_pages and depth parameters complement each other`),
      device: z.string().default('desktop').optional().describe(`device type
optional field
can take the values:desktop, mobile
default value: desktop`),
      people_also_ask_click_depth: z.number().min(1).max(4).optional()
      .describe(`clicks on the corresponding element
        specify the click depth on the people_also_ask element to get additional people_also_ask_element items;`)
    };
  }

  async handle(params:any): Promise<any> {
    try {
      console.error(JSON.stringify(params, null, 2));
      const response = await this.dataForSEOClient.makeRequest(`/v3/serp/${params.search_engine}/organic/live/advanced`, 'POST', [{
        location_name: params.location_name,
        language_code: params.language_code,
        keyword: params.keyword,
        depth: params.depth,
        max_crawl_pages: params.max_crawl_pages,
        device: params.device,
        people_also_ask_click_depth: params.people_also_ask_click_depth && params.people_also_ask_click_depth > 0 ? params.people_also_ask_click_depth : undefined,
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 