import { any, z } from 'zod';
import { BaseTool } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';

export class ContentAnalysisPhraseTrendsTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getName(): string {
    return 'content_analysis_phrase_trends';
  }

  getDescription(): string {
    return `This endpoint will provide you with data on all citations of the target keyword for the indicated date range`;
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
      initial_dataset_filters: z.array(
        z.union([
          z.array(z.union([z.string(), z.number(), z.boolean()])).length(3),
          z.enum(["and", "or"])
        ])
      ).max(8).optional().describe(
        `initial dataset filtering parameters
        initial filtering parameters that apply to fields in the Search endpoint;
        you can add several filters at once (8 filters maximum);
        you should set a logical operator and, or between the conditions;
        the following operators are supported:
        regex, not_regex, <, <=, >, >=, =, <>, in, not_in, like,not_like, has, has_not, match, not_match
        you can use the % operator with like and not_like to match any string of zero or more characters;
        example:
        ["domain","<>", "logitech.com"]
        [["domain","<>","logitech.com"],"and",["content_info.connotation_types.negative",">",1000]]

        [["domain","<>","logitech.com"]],
        "and",
        [["content_info.connotation_types.negative",">",1000],
        "or",
        ["content_info.text_category","has",10994]]`
      ),
      date_from: z.string().describe(`starting date of the time range
        date format: "yyyy-mm-dd"`),
      date_to: z.string().describe(`ending date of the time range
        date format: "yyyy-mm-dd"`).optional(),
      date_group: z.enum(['day', 'week', 'month']).default('month').describe(`date grouping type`).optional(),
      internal_list_limit: z.number().min(1).max(20).default(1)
        .describe(
          `maximum number of elements within internal arrays
          you can use this field to limit the number of elements within the following arrays`)
        .optional(),
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest('/v3/content_analysis/phrase_trends/live', 'POST', [{
        keyword: params.keyword,
        keyword_fields: params.keyword_fields,
        page_type: params.page_type,
        initial_dataset_filters: this.formatFilters(params.initial_dataset_filters),
        date_from: params.date_from,
        date_to: params.date_to,
        date_group: params.date_group,
        internal_list_limit: params.internal_list_limit
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 