import { z } from 'zod';
import { BaseTool } from '../../../base.tool.js';
import { DataForSEOClient } from '../../../../client/dataforseo.client.js';

export class MerchantAmazonSellersLiveAdvancedTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getName(): string {
    return 'merchant_amazon_sellers_live_advanced';
  }

  getDescription(): string {
    return `Get the list of sellers offering a specific Amazon product (by ASIN).
Returns seller names, ratings, prices, shipping conditions, and product offers
available from each merchant for the requested ASIN.`;
  }

  getParams(): z.ZodRawShape {
    return {
      asin: z.string().describe(`product identifier (ASIN) on Amazon
required field
the unique identifier of the product on Amazon;
example: "B07D528W98"`),
location_name: z.string().default('United States').describe(`full name of the location
  required field
  Location format - hierarchical, comma-separated (from most specific to least)
   Can be one of:
   1. Country only: "United States"
   2. Region,Country: "California,United States"
   3. Postal Code,Region,Country: "90210,California,United States"`),
        language_code: z.string().default('en_US').describe(`language code
required field
example: "en_US"
supported languages: ar_SA, ar_AE, zh_CN, zh_TW, cs_CZ, nl_NL, en_AU, en_CA, en_IN, en_AE, en_GB, en_US, fr_CA, fr_FR, de_DE, he_IL, hi_IN, it_IT, ja_JP, ko_KR, pl_PL, pt_BR, es_MX, es_ES, es_US, sv_SE, tr_TR`),
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest(
        '/v3/merchant/amazon/sellers/live/advanced',
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
