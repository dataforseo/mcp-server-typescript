import { any, z } from 'zod';
import { BaseTool } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';

export class ContentAnalysisSummaryTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getName(): string {
    return 'content_analysis_summary';
  }

  getDescription(): string {
    return `This endpoint will provide you with an overview of citation data available for the target keyword`;
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
      initial_dataset_filters: this.getFilterExpression().optional().describe(
        `Array-based initial dataset filter expression applied to Search endpoint fields. A single condition is a 3-element array: [field, operator, value]. Combine conditions with ["and"|"or"] between them: [condition, "and", condition]. Max 8 filters.
Operators: regex, not_regex, <, <=, >, >=, =, <>, in, not_in, like, not_like, has, has_not, match, not_match
Use % with like/not_like as a wildcard.
Examples:
  Single: ["domain", "<>", "logitech.com"]
  Combined: [["domain", "<>", "logitech.com"], "and", ["content_info.connotation_types.negative", ">", 1000]]
  Nested: [["domain", "<>", "logitech.com"], "and", [["content_info.connotation_types.negative", ">", 1000], "or", ["content_info.text_category", "has", 10994]]]`
      ),
      positive_connotation_threshold: z.number()
        .describe(`positive connotation threshold
          specified as the probability index threshold for positive sentiment related to the citation content
          if you specify this field, connotation_types object in the response will only contain data on citations with positive sentiment probability more than or equal to the specified value`).min(0).max(1).optional().default(0.4),
      sentiments_connotation_threshold: z.number()
        .describe(`sentiment connotation threshold
specified as the probability index threshold for sentiment connotations related to the citation content
if you specify this field, sentiment_connotations object in the response will only contain data on citations where the
probability per each sentiment is more than or equal to the specified value`)
        .min(0).max(1).optional().default(0.4),
      internal_list_limit: z.number().min(1).max(20).default(1)
        .describe(
          `maximum number of elements within internal arrays
          you can use this field to limit the number of elements within the following arrays`)
        .optional(),

    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest('/v3/content_analysis/summary/live', 'POST', [{
        keyword: params.keyword,
        keyword_fields: params.keyword_fields,
        page_type: params.page_type,
        initial_dataset_filters: this.formatFilters(params.initial_dataset_filters),
        positive_connotation_threshold: params.positive_connotation_threshold,
        sentiments_connotation_threshold: params.sentiments_connotation_threshold,
        internal_list_limit: params.internal_list_limit
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 