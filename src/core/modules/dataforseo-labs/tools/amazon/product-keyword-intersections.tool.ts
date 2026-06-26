import { z } from 'zod';
import { DataForSEOClient } from '../../../../client/dataforseo.client.js';
import { BaseTool } from '../../../base.tool.js';

export class AmazonProductKeywordIntersectionsTool extends BaseTool {
  constructor(client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'dataforseo_labs_amazon_product_kw_intersections';
  }

  getDescription(): string {
    return `This endpoint will provide you with a list of keywords for which the target products intersect in Amazon SERP. The returned results are specific to the asins specified in a POST request.`;
  }

  getTitle(): string {
    return 'DataForSEO Labs Amazon Product Keyword Intersections';
  }

  getParams(): z.ZodRawShape {
    return {
      asins: z.array(z.string()).min(1).max(20).describe(`target product ASINs
required field
product IDs of the products for which you need to find keyword intersections
the maximum number of ASINs you can specify is 20
example: ["B09172433Z", "B07GBZ4Q68"]`),
      location_name: z.string().default("United States").describe(`full name of the location
required field if location_code is not specified
Note: this endpoint currently supports the US, Egypt, Saudi Arabia, and the United Arab Emirates locations only
example: 'United States'`),
      language_code: z.string().default("en").describe(
        `language code
        required field if language_name is not specified
        example:
        en`),
      limit: z.number().min(1).max(1000).default(10).optional().describe("Maximum number of keywords to return"),
      offset: z.number().min(0).optional().describe(
        `offset in the results array of returned keywords
        optional field
        default value: 0
        if you specify the 10 value, the first ten keywords in the results array will be omitted and the data will be provided for the successive keywords`
      ),
      intersection_mode: z.enum(['union', 'intersect']).default('intersect').optional().describe(
        `mode for finding asin intersections
optional field
possible values: union, intersect
default value: intersect`),
      filters: this.getFilterExpression().optional().describe(
        `Array-based filter expression. A single condition is a 3-element array: [field, operator, value]. Combine conditions with ["and"|"or"] between them: [condition, "and", condition]. Max 8 filters.
Operators: regex, not_regex, <, <=, >, >=, =, <>, in, not_in, match, not_match, ilike, not_ilike, like, not_like
Use % with like/not_like/ilike/not_ilike as a wildcard.
Example: ["avg_position", "<", 10]`
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
["sum_position,desc"]
default rule:
["intersections,desc"]
note that you can set no more than three sorting rules in a single request
example:
["intersections,desc","avg_position,asc"]`
      ),
    };
  }

  private formatAsins(asins: string[]): Record<string, string> {
    return asins.reduce((acc: Record<string, string>, asin: string, index: number) => {
      acc[String(index + 1)] = asin;
      return acc;
    }, {});
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest('/v3/dataforseo_labs/amazon/product_keyword_intersections/live', 'POST', [{
        asins: this.formatAsins(params.asins),
        location_name: params.location_name,
        language_code: params.language_code,
        limit: params.limit,
        offset: params.offset,
        intersection_mode: params.intersection_mode,
        filters: this.formatFilters(params.filters),
        order_by: this.formatOrderBy(params.order_by),
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
}
