import { z } from 'zod';
import { BaseTool } from '../../../base.tool.js';
import { DataForSEOClient } from '../../../../client/dataforseo.client.js';

export class GoogleAdsSearchVolumeTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getName(): string {
    return 'kw_data_google_ads_search_volume';
  }

  getDescription(): string {
    return 'Get search volume data for keywords from Google Ads';
  }

  getParams(): z.ZodRawShape {
    return {
      location_name: z.string().default('United States').describe(`full name of the location
required field
Location format - hierarchical, comma-separated (from most specific to least)
 Can be one of:
 1. Country only: "United States"
 2. Region,Country: "California,United States"
 3. City,Region,Country: "San Francisco,California,United States"`),
      language_code: z.string().nullable().default(null).describe(`Language two-letter ISO code (e.g., 'en').
optional field`),
      keywords: z.array(z.string()).describe("Array of keywords to get search volume for"),
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest('/v3/keywords_data/google_ads/search_volume/live', 'POST', [{
        location_name: params.location_name,
        language_code: params.language_code,
        keywords: params.keywords,
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 