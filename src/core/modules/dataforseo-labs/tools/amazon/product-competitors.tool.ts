import { z } from 'zod';
import { DataForSEOClient } from '../../../../client/dataforseo.client.js';
import { BaseTool } from '../../../base.tool.js';

export class AmazonProductCompetitorsTool extends BaseTool {
  constructor(client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'dataforseo_labs_amazon_product_competitors';
  }

  getDescription(): string {
    return `This endpoint will provide you with a list of products that intersect with a target asin in Amazon SERPs. The data can help you identify product competitors for any listing published on Amazon.`;
  }

  getTitle(): string {
    return 'DataForSEO Labs Amazon Product Competitors';
  }

  getParams(): z.ZodRawShape {
    return {
      asin: z.string().describe(`product ID
required field
unique product identifier (ASIN) on Amazon`),
      location_name: z.string().default("United States").describe(`full name of the location
required field if location_code is not specified
Note: this endpoint currently supports the US, Egypt, Saudi Arabia, and the United Arab Emirates locations only
example: 'United States'`),
      language_code: z.string().default("en").describe(
        `language code
        required field if language_name is not specified
        example:
        en`),
      limit: z.number().min(1).max(1000).default(10).optional().describe("Maximum number of product competitors to return"),
      offset: z.number().min(0).optional().describe(
        `offset in the results array of returned product competitors
        optional field
        default value: 0
        if you specify the 10 value, the first ten product competitors in the results array will be omitted and the data will be provided for the successive product competitors`
      ),
      filters: this.getFilterExpression().optional().describe(
        `Array-based filter expression. A single condition is a 3-element array: [field, operator, value]. Combine conditions with ["and"|"or"] between them: [condition, "and", condition]. Max 8 filters.
Operators: regex, not_regex, <, <=, >, >=, =, <>, in, not_in, match, not_match, ilike, not_ilike, like, not_like
Use % with like/not_like/ilike/not_ilike as a wildcard.
Example: ["full_metrics.amazon_serp.pos_1", ">", 20]`
      ),
      order_by: z.array(z.string()).optional().describe(
        `results sorting rules
optional field
you can use the same values as in the filters array to sort the results
possible sorting types:
asc – results will be sorted in the ascending order
desc – results will be sorted in the descending order
you should use a comma to set up a sorting parameter
example:
["full_metrics.amazon_serp.pos_1,desc"]
default rule:
["ranked_serp_element.serp_item.rank_group,asc"]
note that you can set no more than three sorting rules in a single request
example:
["full_metrics.amazon_serp.pos_1,desc","avg_position,desc"]`
      ),
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest('/v3/dataforseo_labs/amazon/product_competitors/live', 'POST', [{
        asin: params.asin,
        location_name: params.location_name,
        language_code: params.language_code,
        limit: params.limit,
        offset: params.offset,
        filters: this.formatFilters(params.filters),
        order_by: this.formatOrderBy(params.order_by),
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
}
