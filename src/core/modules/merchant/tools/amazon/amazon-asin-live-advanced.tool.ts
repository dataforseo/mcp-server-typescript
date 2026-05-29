import { z } from 'zod';
import { BaseTool } from '../../../base.tool.js';
import { DataForSEOClient } from '../../../../client/dataforseo.client.js';

export class MerchantAmazonAsinLiveAdvancedTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getName(): string {
    return 'merchant_amazon_asin_live_advanced';
  }

  getDescription(): string {
    return `Get detailed product information from Amazon by ASIN (Amazon Standard Identification Number).
Returns product title, price, description, images, reviews summary, seller info,
shipping options, and other product attributes for the specified ASIN.`;
  }

  getTitle(): string {
    return 'Merchant Amazon ASIN Live Advanced';
  }

  getParams(): z.ZodRawShape {
    return {
      asin: z.string().describe(`product ID
required field
unique product identifier (ASIN) in Amazon
you can receive the asin parameter by making a separate request to the merchant_amazon_products_live_advanced`),
      location_name: z.string().default('United States').describe(`full name of the location
required field
Location format - hierarchical, comma-separated (from most specific to least)
 Can be one of:
 1. Country only: "United States"
 2. Postal Code,Region,Country: "90210,California,United States"`),
      language_code: z.string().default('en_US').describe(`language code
required field
example: "en_US"
supported languages: ar_SA, ar_AE, zh_CN, zh_TW, cs_CZ, nl_NL, en_AU, en_CA, en_IN, en_AE, en_GB, en_US, fr_CA, fr_FR, de_DE, he_IL, hi_IN, it_IT, ja_JP, ko_KR, pl_PL, pt_BR, es_MX, es_ES, es_US, sv_SE, tr_TR`),
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest(
        '/v3/merchant/amazon/asin/live/advanced',
        'POST',
        [{
          asin: params.asin,
          location_name: params.location_name,
          language_code: params.language_code,
        }],
      );
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
}
