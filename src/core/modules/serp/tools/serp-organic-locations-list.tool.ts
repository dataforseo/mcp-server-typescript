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
    return 'Utility tool for serp_organic_live_advanced to get list of availible locations.';
  }
  
  getTitle(): string {
    return 'SERP Locations';
  }
  
  getParams(): z.ZodRawShape {
    return {
      search_engine: z.string().default('google').describe("search engine name, one of: google, yahoo, bing."),
      country_iso_code: z.string().describe("ISO 3166-1 alpha-2 country code, for example: US, GB, MT"),
      location_type: z.string().optional().describe("Type of location. Possible variants: 'TV Region','Postal Code','Neighborhood','Governorate','National Park','Quarter','Canton','Airport','Okrug','Prefecture','City','Country','Province','Barrio','Sub-District','Congressional District','Municipality District','district','DMA Region','Union Territory','Territory','Colloquial Area','Autonomous Community','Borough','County','State','District','City Region','Commune','Region','Department','Division','Sub-Ward','Municipality','University'"),
      location_name: z.string().optional().describe("Name of location or it`s part.")
    };
  }

  async handle(params:any): Promise<any> {
    try {

      const payload: Record<string, unknown> = {
        'country_iso_code': params.country_iso_code,
      };

      if (params.location_type) {
        payload['location_type'] = params.location_type;
      }
      
      if (params.location_name) {
        payload['location_name'] = params.location_name;
      }

      const response = await this.dataForSEOClient.makeRequest(`/v3/serp/${params.search_engine}/locations`, 'POST', [payload]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 