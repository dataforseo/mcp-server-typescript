import { z } from 'zod';
import { BaseTool, DataForSEOFullResponse } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';
import { DataForSEOResponse } from '../../base.tool.js';

export class SerpOrganicLocationsListTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getName(): string {
    return 'serp_locations';
  }

  getDescription(): string {
    return 'Utility tool for serp_organic_live_advanced to get list of availible locations';
  }

  protected supportOnlyFullResponse(): boolean {
    return true;
  }

  getParams(): z.ZodRawShape {
    return {
      search_engine: z.string().default('google').describe("search engine name, one of: google, yahoo, bing."),
      country_code: z.string().default('US').describe("country code (e.g., 'US')"),
    };
  }

  async handle(params:any): Promise<any> {
    try {
      console.error(JSON.stringify(params, null, 2));
      const response = await this.dataForSEOClient.makeRequest(`/v3/serp/${params.search_engine}/locations/${params.country_code}`, 'GET', null, true) as DataForSEOFullResponse;      
      this.validateResponseFull(response);
      return this.formatResponse(response.tasks[0].result.map(x => x.location_name));
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 