import { z } from 'zod';
import { DataForSEOClient } from '../../../../client/dataforseo.client.js';
import { BaseTool } from '../../../base.tool.js';

export class AmazonProductRankOverviewTool extends BaseTool {
  constructor(client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'dataforseo_labs_amazon_product_rank_overview';
  }

  getDescription(): string {
    return `This endpoint will provide you with ranking data from organic and paid Amazon SERPs for the target products. The returned results are specific to the asins specified in a POST request.`;
  }

  getTitle(): string {
    return 'DataForSEO Labs Amazon Product Rank Overview';
  }

  getParams(): z.ZodRawShape {
    return {
      asins: z.array(z.string()).min(1).max(1000).describe(`product IDs to compare
required field
product IDs to receive ranking data for
the maximum number of ASINs you can specify in this array is 1000
Note: all letters in ASIN code must be specified in uppercase format
example: ["B001TJ3HUG", "B01LW2SL7R"]`),
      location_name: z.string().default("United States").describe(`full name of the location
required field if location_code is not specified
Note: this endpoint currently supports the US, Egypt, Saudi Arabia, and the United Arab Emirates locations only
example: 'United States'`),
      language_code: z.string().default("en").describe(
        `language code
        required field if language_name is not specified
        example:
        en`),
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest('/v3/dataforseo_labs/amazon/product_rank_overview/live', 'POST', [{
        asins: params.asins,
        location_name: params.location_name,
        language_code: params.language_code,
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
}
