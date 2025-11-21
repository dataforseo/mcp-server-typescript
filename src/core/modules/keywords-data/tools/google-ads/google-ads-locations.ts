import { BaseTool, DataForSEOFullResponse } from '../../../base.tool.js';
import { DataForSEOClient } from '../../../../client/dataforseo.client.js';
import { z } from 'zod';

export class GoogleAdsLocationsListTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getName(): string {
    return 'keywords_data_google_ads_locations';
  }

  getDescription(): string {
    return 'Utility tool for keywords_data_google_ads_search_volume to get list of availible locations.';
  }
  
  getParams(): z.ZodRawShape {
    return {
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

      const response = await this.dataForSEOClient.makeRequest(`/v3/keywords_data/google_ads/locations`, 'POST', [payload]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 