import { z } from 'zod';
import { BaseTool } from '../../../base.tool.js';
import { DataForSEOClient } from '../../../../client/dataforseo.client.js';

export class MerchantAmazonLocationsListTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getTitle(): string {
    return 'Merchant Amazon Locations';
  }

  protected supportOnlyFullResponse(): boolean {
    return true;
  }

  getName(): string {
    return 'merchant_amazon_locations';
  }

  getDescription(): string {
    return `Utility tool for Amazon merchant tools (merchant_amazon_asin_live_advanced,
merchant_amazon_sellers_live_advanced, merchant_amazon_products_live_advanced)
to get the list of available locations with their location_code and location_name values.
You can optionally filter the list by country ISO code.`;
  }

  getParams(): z.ZodRawShape {
    return {
      country: z.string().optional().describe(`ISO 3166-1 alpha-2 country code to filter locations by
optional field
example: "US", "GB", "DE"
if omitted, the full list of available Amazon locations is returned`),
      "location_name_contains": z.string().optional().describe(`filter locations by a substring match on location_name
optional field
example: "New York", "London"
if omitted, no name filtering is applied`),
      "limit": z.number().optional().describe(`maximum number of locations to return`),
      "offset": z.number().optional().describe(`offset in the results array of returned locations`)      
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const country = typeof params?.country === 'string' ? params.country.trim() : '';
      const endpoint = country
        ? `/v3/merchant/amazon/locations/${encodeURIComponent(country)}`
        : '/v3/merchant/amazon/locations';
      const response = await this.dataForSEOClient.makeRequest<any>(endpoint, 'GET', null);
      if (response.items && response.items.length > 0) {
        const nameFilter = typeof params?.location_name_contains === 'string' ? params.location_name_contains.trim().toLowerCase() : '';
        if (nameFilter) {
          response.items = response.items.filter((item: any) =>
            typeof item.location_name === 'string' && item.location_name.toLowerCase().includes(nameFilter)
          );
        }
        response.items = response.items.slice(params.offset || 0, (params.offset || 0) + (params.limit || 100));
      }
      return this.formatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
}
