import { z } from 'zod';
import { DataForSEOClient } from '../../../../../client/dataforseo.client.js';
import { BaseTool, DataForSEOFullResponse, DataForSEOResponse } from '../../../../base.tool.js';
import { defaultGlobalToolConfig } from '../../../../../config/global.tool.js';

export class GoogleHistoricalSERP extends BaseTool {
  constructor(private client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'dataforseo_labs_google_historical_serp';
  }

  getDescription(): string {
    return `This endpoint will provide you with Google SERPs collected within the specified time frame. You will also receive a complete overview of featured snippets and other extra elements that were present within the specified dates. The data will allow you to analyze the dynamics of keyword rankings over time for the specified keyword and location.`;
  }

  getParams(): z.ZodRawShape {
    return {
      keyword: z.string().describe(`target keyword`),
      location_name: z.string().default("United States").describe(`full name of the location
required field
in format "Country"
example:
United Kingdom`),
      language_code: z.string().default("en").describe(
        `language code
        required field
        example:
        en`)
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.client.makeRequest('/v3/dataforseo_labs/google/historical_serps/live', 'POST', [{
        keyword: params.keyword,
        location_name: params.location_name,
        language_code: params.language_code
      }]);

      console.error(JSON.stringify(response));
      if(defaultGlobalToolConfig.fullResponse || this.supportOnlyFullResponse()){
        return this.validateAndFormatResponse(response);
      }
      else {
        let data = response as DataForSEOResponse;
        this.validateResponse(data);
        let result = data.items;
        let filteredResult = result.map(item => this.filterResponseFields(item, [     
          "datetime",
          "items.type",
          "items.title",
          "items.domain",
          "items.rank_absolute"]));
          console.error(JSON.stringify(filteredResult));
        return this.formatResponse(filteredResult);
      }
      } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 