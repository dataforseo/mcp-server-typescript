import { z } from 'zod';
import { DataForSEOClient } from '../../../../client/dataforseo.client.js';
import { BaseTool } from '../../../base.tool.js';

export class AmazonBulkSearchVolumeTool extends BaseTool {
  constructor(client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'dataforseo_labs_amazon_bulk_search_volume';
  }

  getDescription(): string {
    return `This endpoint will provide you with search volume values for a maximum of 1,000 keywords in one API request. Search volume represents the approximate number of monthly searches for a keyword on Amazon.`;
  }

  getTitle(): string {
    return 'DataForSEO Labs Amazon Bulk Search Volume';
  }

  getParams(): z.ZodRawShape {
    return {
      keywords: z.array(z.string()).min(1).max(1000).describe(`target keywords
required field
UTF-8 encoding
maximum number of keywords you can specify in this array: 1000
the keywords will be converted to lowercase format`),
      location_name: z.string().default("United States").describe(`full name of the location
required field if location_code is not specified
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
      const response = await this.dataForSEOClient.makeRequest('/v3/dataforseo_labs/amazon/bulk_search_volume/live', 'POST', [{
        keywords: params.keywords,
        location_name: params.location_name,
        language_code: params.language_code,
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
}
