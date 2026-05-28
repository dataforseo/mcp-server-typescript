import { z } from 'zod';
import { BaseTool } from '../../../base.tool.js';
import { DataForSEOClient } from '../../../../client/dataforseo.client.js';

export class MerchantAmazonProductsLiveAdvancedTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getName(): string {
    return 'merchant_amazon_products_live_advanced';
  }

  getDescription(): string {
    return `Search Amazon products by keyword and get the list of matching items.
Returns product titles, ASINs, prices, ratings, images, sponsored placements,
and other SERP-like results for the specified keyword on Amazon.`;
  }

  getTitle(): string {
    return 'Merchant Amazon Products Live Advanced';
  }

  getParams(): z.ZodRawShape {
    return {
      keyword: z.string().describe(`keyword
required field
the keyword that will be searched for on Amazon;
example: "shoes"`),
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
      department: z.enum([
        'Arts & Crafts',
        'Automotive',
        'Baby',
        'Beauty & Personal Care',
        'Books',
        'Computers',
        'Digital Music',
        'Electronics',
        'Kindle Store',
        'Prime Video',
        "Women's Fashion",
        "Men's Fashion",
        "Girls' Fashion",
        "Boys' Fashion",
        'Deals',
        'Health & Household',
        'Home & Kitchen',
        'Industrial & Scientific',
        'Luggage',
        'Movies & TV',
        'Music, CDs & Vinyl',
        'Pet Supplies',
        'Software',
        'Sports & Outdoors',
        'Tools & Home Improvement',
        'Toys & Games',
        'Video Games',
      ]).optional().describe(`amazon product department
optional field
specify one of the supported amazon departments for extracting product listings`),
      price_min: z.number().int().optional().describe(`minimum product price
optional field
minimum price of the returned products listed on Amazon for the specified query
example: 5
Note: if you specify price_min, the search_param parameter will be ignored`),
      price_max: z.number().int().optional().describe(`maximum product price
optional field
maximum price of the returned products listed on Amazon for the specified query
example: 100
Note: if you specify price_max, the search_param parameter will be ignored`),
      sort_by: z.enum([
        'relevance',
        'price_low_to_high',
        'price_high_to_low',
        'featured',
        'avg_customer_review',
        'newest_arrival',
      ]).optional().describe(`results sorting rules
optional field
supported values: relevance, price_low_to_high, price_high_to_low, featured, avg_customer_review, newest_arrival
example: "relevance"`),
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest(
        '/v3/merchant/amazon/products/live/advanced',
        'POST',
        [{
          keyword: params.keyword,
          location_name: params.location_name,
          language_code: params.language_code,
          department: params.department,
          price_min: params.price_min,
          price_max: params.price_max,
          sort_by: params.sort_by,
        }],
      );
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
}
