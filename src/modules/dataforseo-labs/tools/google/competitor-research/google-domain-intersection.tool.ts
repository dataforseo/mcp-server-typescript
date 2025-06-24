import { z } from 'zod';
import { DataForSEOClient } from '../../../../../client/dataforseo.client.js';
import { BaseTool } from '../../../../base.tool.js';

export class GoogleDomainIntersectionsTool extends BaseTool {
  constructor(private client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'dataforseo_labs_google_domain_intersection';
  }

  getDescription(): string {
    return `This endpoint will provide you with the keywords for which both specified domains rank within the same SERP. You will get search volume, competition, cost-per-click and impressions data on each intersecting keyword. Along with that, you will get data on the first and second domain's SERP element discovered for this keyword, as well as the estimated traffic volume and cost of ad traffic.`;
  }

  getParams(): z.ZodRawShape {
    return {
      target1: z.string().describe(`target domain 1`),
      target2: z.string().describe(`target domain 2 `),
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
      ignore_synonyms: z.boolean().default(true).describe(
          `ignore highly similar keywords, if set to true, results will be more accurate`),
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
        `you can add several filters at once (8 filters maximum)
        you should set a logical operator and, or between the conditions
        the following operators are supported:
        regex, not_regex, <, <=, >, >=, =, <>, in, not_in, match, not_match, ilike, not_ilike, like, not_like
        you can use the % operator with like and not_like, as well as ilike and not_ilike to match any string of zero or more characters
        merge operator must be a string and connect two other arrays, availible values: or, and.
        example:
        ["keyword_data.keyword_info.search_volume","in",[100,1000]]
        [["first_domain_serp_element.etv",">",0],"and",["first_domain_serp_element.description","like","%goat%"]]
        [["keyword_data.keyword_info.search_volume",">",100],"and",[["first_domain_serp_element.description","like","%goat%"],"or",["second_domain_serp_element.type","=","organic"]]]`
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
["keyword_data.keyword_info.search_volume,desc"]
note that you can set no more than three sorting rules in a single request
you should use a comma to separate several sorting rules
example:
["keyword_data.keyword_info.search_volume,desc","keyword_data.keyword_info.cpc,desc"]`
      ),
      intersections: z.boolean().optional().describe(`domain intersections in SERP
optional field
if you set intersections to true, you will get the keywords for which both target domains specified as target1 and target2 have results within the same SERP; the corresponding SERP elements for both domains will be provided in the results array
Note: this endpoint will not provide results if the number of intersecting keywords exceeds 10 million
if you specify intersections: false, you will get the keywords for which the domain specified as target1 has results in SERP, and the domain specified as target2 doesn’t;
thus, the corresponding SERP elements and other data will be provided for the domain specified as target1only
default value: true`).default(true),
      include_clickstream_data: z.boolean().optional().default(false).describe(
        `Include or exclude data from clickstream-based metrics in the result`)


    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.client.makeRequest('/v3/dataforseo_labs/google/domain_intersection/live', 'POST', [{
        target1: params.target1,
        target2: params.target2,
        location_name: params.location_name,
        language_code: params.language_code,
        ignore_synonyms: params.ignore_synonyms,
        filters: this.formatFilters(params.filters),
        order_by: this.formatOrderBy(params.order_by),
        exclude_top_domains: params.exclude_top_domains,
        item_types: ['organic'],
        intersections: params.intersections,
        include_clickstream_data: params.include_clickstream_data,
        limit: params.limit,
        offset: params.offset
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 