import { z } from 'zod';
import { DataForSEOClient } from '../../../../client/dataforseo.client.js';
import { BaseTool } from '../../../base.tool.js';

export class AmazonRankedKeywordsTool extends BaseTool {
  constructor(client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'dataforseo_labs_amazon_ranked_keywords';
  }

  getDescription(): string {
    return `This endpoint will provide you with a list of keywords the target product ranks for on Amazon. The returned results are specific to the asin specified in a POST request.`;
  }

  getTitle(): string {
    return 'DataForSEO Labs Amazon Ranked Keywords';
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
      limit: z.number().min(1).max(1000).default(10).optional().describe("Maximum number of keywords to return"),
      offset: z.number().min(0).optional().describe(
        `offset in the results array of returned keywords
        optional field
        default value: 0
        if you specify the 10 value, the first ten keywords in the results array will be omitted and the data will be provided for the successive keywords`
      ),
      filters: this.getFilterExpression().optional().describe(
        `Array-based filter expression. A single condition is a 3-element array: [field, operator, value]. Combine conditions with ["and"|"or"] between them: [condition, "and", condition]. Max 8 filters.
Operators: regex, not_regex, <, <=, >, >=, =, <>, in, not_in, like, not_like, match, not_match
Use % with like/not_like as a wildcard.
Example: ["keyword_data.keyword_info.search_volume", "in", [100, 1000]]`
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
["keyword_data.keyword_info.competition,desc"]
default rule:
["ranked_serp_element.serp_item.rank_group,asc"]
note that you can set no more than three sorting rules in a single request
example:
["keyword_data.keyword_info.search_volume,desc","keyword_data.keyword_info.cpc,desc"]`
      ),
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest('/v3/dataforseo_labs/amazon/ranked_keywords/live', 'POST', [{
        asin: params.asin,
        location_name: params.location_name,
        language_code: params.language_code,
        limit: params.limit,
        offset: params.offset,
        ignore_synonyms: params.ignore_synonyms,
        filters: this.formatFilters(params.filters),
        order_by: this.formatOrderBy(params.order_by),
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
}
