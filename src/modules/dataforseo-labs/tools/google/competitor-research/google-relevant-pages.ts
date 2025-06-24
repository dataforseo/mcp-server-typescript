import { z } from 'zod';
import { DataForSEOClient } from '../../../../../client/dataforseo.client.js';
import { BaseTool } from '../../../../base.tool.js';

export class GoogleDomainCompetitorsTool extends BaseTool {
  constructor(private client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'dataforseo_labs_google_relevant_pages';
  }

  getDescription(): string {
    return `This endpoint will provide you with rankings and traffic data for the web pages of the specified domain. You will be able to review each page’s ranking distribution and estimated monthly traffic volume from both organic and paid searches.`;
  }

  getParams(): z.ZodRawShape {
    return {
      target: z.string().describe(`target domain`),
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
["metrics.organic.count",">",50]
[["metrics.organic.pos_1","<>",0],"and",["metrics.organic.impressions_etv",">=","10"]]

[[["metrics.organic.count",">=",50],"and",["metrics.organic.pos_1","in",[1,5]]],
"or",
["metrics.organic.etv",">=","100"]]`
          ),
          order_by: z.array(z.string()).optional().describe(
            `results sorting rules
optional field
you can use the same values as in the filters array to sort the results
possible sorting types:
asc – results will be sorted in the ascending order
desc – results will be sorted in the descending order
you should use a comma to specify a sorting type
example:
["metrics.paid.etv,asc"]
Note: you can set no more than three sorting rules in a single request
you should use a comma to separate several sorting rules
example:
["metrics.organic.etv,desc","metrics.paid.count,asc"]
default rule:
["metrics.organic.count,desc"]`
          ),
          exclude_top_domains: z.boolean().default(true).describe(`indicates whether to exclude world’s largest websites
optional field
default value: false
set to true if you want to get highly-relevant competitors excluding the top websites`) ,
          item_types: z.array(z.string()).optional().describe(
            `item types to return
            optional field
            default: ['organic']
            possible values:
            organic
            paid`
        ),
          include_clickstream_data: z.boolean().optional().default(false).describe(
            `Include or exclude data from clickstream-based metrics in the result`)

    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.client.makeRequest('/v3/dataforseo_labs/google/relevant_pages/live', 'POST', [{
        target: params.target,
        location_name: params.location_name,
        language_code: params.language_code,
        ignore_synonyms: params.ignore_synonyms,
        filters: this.formatFilters(params.filters),
        order_by: this.formatOrderBy(params.order_by),
        exclude_top_domains: params.exclude_top_domains,
        item_types: params.item_types,
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