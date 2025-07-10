import { z } from 'zod';
import { BaseTool } from '../../../base.tool.js';
import { DataForSEOClient } from '../../../../client/dataforseo.client.js';

export class GoogleTrendsExploreTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getName(): string {
    return 'keywords_data_google_trends_explore';
  }

  getDescription(): string {
    return 'This endpoint will provide you with the keyword popularity data from the ‘Explore’ feature of Google Trends. You can check keyword trends for Google Search, Google News, Google Images, Google Shopping, and YouTube';
  }

  getParams(): z.ZodRawShape {
    return {
      location_name: z.string().nullable().default(null).describe(`full name of the location
        optional field
        in format "Country"
        example:
        United Kingdom`),
      language_code: z.string().nullable().default(null).describe(`Language two-letter ISO code (e.g., 'en').
        optional field`), 
      keywords: z.array(z.string()).describe(`keywords
        the maximum number of keywords you can specify: 5
        the maximum number of characters you can specify in a keyword: 100
        the minimum number of characters must be greater than 1
        comma characters (,) in the specified keywords will be unset and ignored
        Note: keywords cannot consist of a combination of the following characters: < > | \ " - + = ~ ! : * ( ) [ ] { }

        Note: to obtain google_trends_topics_list and google_trends_queries_list items, specify no more than 1 keyword`),
      type: z.enum(['web', 'news', 'youtube','images','froogle']).default('web').describe(`google trends type`),
      date_from: z.string().optional().describe(`starting date of the time range
          if you don’t specify this field, the current day and month of the preceding year will be used by default
          minimal value for the web type: 2004-01-01
          minimal value for other types: 2008-01-01
          date format: "yyyy-mm-dd"
          example:
          "2019-01-15"`),
      date_to: z.string().optional()
          .describe(
            `ending date of the time range
            if you don’t specify this field, the today’s date will be used by default
            date format: "yyyy-mm-dd"
            example:
            "2019-01-15"`),
      time_range: z.enum(['past_hour', 'past_4_hours', 'past_day', 'past_7_days', 'past_30_days', 'past_90_days', 'past_12_months', 'past_5_years'])
          .default('past_7_days')
          .describe(
            `preset time ranges
            if you specify date_from or date_to parameters, this field will be ignored when setting a task`),
      item_types: z.array(z.enum(['google_trends_graph', 'google_trends_map', 'google_trends_topics_list', 'google_trends_queries_list']))
          .default(['google_trends_graph'])
          .describe(
            `types of items returned
            to speed up the execution of the request, specify one item at a time`),
      category_code: z.nullable(z.number()).default(null)
          .describe(
            `google trends search category
            you can receive the list of available categories with their category_code by making a separate request to the keywords_data_google_trends_categories tool`)
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest('/v3/keywords_data/google_trends/explore/live', 'POST', [{
        location_name: params.location_name,
        language_code: params.language_code,
        keywords: params.keywords,
        type: params.type,
        date_from: params.date_from,
        date_to: params.date_to,
        time_range: params.time_range,
        item_types: params.item_types,
        category_code: params.category_code
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 