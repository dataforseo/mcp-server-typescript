import { any, z } from 'zod';
import { BaseTool } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';

export class ContentAnalysisSearchTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getName(): string {
    return 'content_analysis_search';
  }

  getDescription(): string {
    return `This endpoint will provide you with detailed citation data available for the target keyword`;
  }

  getParams(): z.ZodRawShape {
    return {
      keyword: z.string().describe(`target keyword
        Note: to match an exact phrase instead of a stand-alone keyword, use double quotes and backslashes;`),
      keyword_fields: z.object({
        title: z.string().optional(),
        main_title: z.string().optional(),
        previous_title: z.string().optional(),
        snippet: z.string().optional()
      }).optional().describe(
        `target keyword fields and target keywords
        use this parameter to filter the dataset by keywords that certain fields should contain;
        you can indicate several fields;
        Note: to match an exact phrase instead of a stand-alone keyword, use double quotes and backslashes;
        example:
        {
          "snippet": "\\"logitech mouse\\"",
          "main_title": "sale"
        }`
      ),
      page_type: z.array(z.enum(['ecommerce','news','blogs', 'message-boards','organization'])).optional().describe(`target page types`),
      search_mode: z.enum(['as_is', 'one_per_domain']).optional().describe(`results grouping type`),
      limit: z.number().min(1).max(1000).default(10).describe(`maximum number of results to return`),
      offset: z.number().min(0).default(0).describe(`offset in the results array of returned keywords`),
      filters: z.array(
        z.union([
          z.array(z.union([z.string(), z.number(), z.boolean()])).length(3),
          z.enum(["and", "or"])
        ])
      ).max(8).optional().describe(
        `array of results filtering parameters
optional field
you can add several filters at once (8 filters maximum)
you should set a logical operator and, or between the conditions
the following operators are supported:
regex, not_regex, <, <=, >, >=, =, <>, in, not_in, like,not_like, match, not_match
you can use the % operator with like and not_like to match any string of zero or more characters
example:
["country","=", "US"]
[["domain_rank",">",800],"and",["content_info.connotation_types.negative",">",0.9]]

[["domain_rank",">",800],
"and",
[["page_types","has","ecommerce"],
"or",
["content_info.text_category","has",10994]]`
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
["content_info.sentiment_connotations.anger,desc"]
default rule:
["content_info.sentiment_connotations.anger,desc"]
note that you can set no more than three sorting rules in a single request
you should use a comma to separate several sorting rules
example:
["content_info.sentiment_connotations.anger,desc","keyword_data.keyword_info.cpc,desc"]`,
      ),    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest('/v3/content_analysis/search/live', 'POST', [{
        keyword: params.keyword,
        page_type: params.page_type,
        search_mode: params.search_mode,
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