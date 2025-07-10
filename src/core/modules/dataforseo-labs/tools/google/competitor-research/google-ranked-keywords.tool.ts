import { z } from 'zod';
import { DataForSEOClient } from '../../../../../client/dataforseo.client.js';
import { BaseTool } from '../../../../base.tool.js';

export class GoogleRankedKeywordsTool extends BaseTool {
  constructor(private client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'dataforseo_labs_google_ranked_keywords';
  }

  getDescription(): string {
    return "This endpoint will provide you with the list of keywords that any domain or webpage is ranking for. You will also get SERP elements related to the keyword position, as well as impressions, monthly searches and other data relevant to the returned keywords.";
  }

  getParams(): z.ZodRawShape {
    return {
      target: z.string().describe(`domain name or page url
required field
the domain name of the target website or URL of the target webpage;
the domain name must be specified without https:// or www.;
the webpage URL must be specified with https:// or www.
Note: if you specify the webpage URL without https:// or www., the result will be returned for the entire domain rather than the specific page
`),
      location_name: z.string().default("United States").describe(`full name of the location
required field
in format "Country"
example:
United Kingdom`),
      language_code: z.string().default("en").describe(
        `language code
        required field
        example:
        en`),
      limit: z.number().min(1).max(1000).default(10).optional().describe("Maximum number of keywords to return"),
      offset: z.number().min(0).optional().describe(
        `offset in the results array of returned keywords
        optional field
        default value: 0
        if you specify the 10 value, the first ten keywords in the results array will be omitted and the data will be provided for the successive keywords`
      ),
      filters: z.array(
        z.union([
          z.array(z.union([z.string(), z.number(), z.boolean()])).length(3),
          z.enum(["and", "or"])
        ])
      ).max(8).optional().describe(
        `Array of filter conditions and logical operators. Each filter condition is an array of [field, operator, value].
        Maximum 8 filters allowed.
        Available operators: =, <>, <, <=, >, >=, in, not_in, like, not_like, ilike, not_ilike, regex, not_regex, match, not_match
        Logical operators: "and", "or"
        Examples:
        Simple filter: [["ranked_serp_element.serp_item.rank_group","<=",10]]
        With logical operator: [["ranked_serp_element.serp_item.rank_group","<=",10],"or",["ranked_serp_element.serp_item.type","<>","paid"]]
        Complex filter: [["keyword_data.keyword_info.search_volume","<>",0],"and",[["ranked_serp_element.serp_item.type","<>","paid"],"or",["ranked_serp_element.serp_item.is_malicious","=",false]]]`
      ),
      order_by: z.array(z.string()).optional().describe(
        `results sorting rules
optional field
you can use the same values as in the filters array to sort the results
possible sorting types:
asc – results will be sorted in the ascending order
desc – results will be sorted in the descending order
you should use a comma to set up a sorting type
example:
["keyword_data.keyword_info.competition,desc"]
default rule:
["ranked_serp_element.serp_item.rank_group,asc"]
note that you can set no more than three sorting rules in a single request
you should use a comma to separate several sorting rules
example:
["keyword_data.keyword_info.search_volume,desc","keyword_data.keyword_info.cpc,desc"]`
      ),
      include_subdomains: z.boolean().optional().describe("Include keywords from subdomains"),
      include_clickstream_data: z.boolean().optional().default(false).describe(
        `Include or exclude data from clickstream-based metrics in the result`)
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.client.makeRequest('/v3/dataforseo_labs/google/ranked_keywords/live', 'POST', [{
        target: params.target,
        location_name: params.location_name,
        language_code: params.language_code,
        limit: params.limit,
        offset: params.offset,
        filters: this.formatFilters(params.filters),
        order_by: this.formatOrderBy(params.order_by),
        include_subdomains: params.include_subdomains,
        include_clickstream_data: params.include_clickstream_data
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 