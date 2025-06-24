import { z } from 'zod';
import { BaseTool } from '../../../base.tool.js';
import { DataForSEOClient } from '../../../../client/dataforseo.client.js';

export class DataForSeoTrendsExploreTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getName(): string {
    return 'keywords_data_dataforseo_trends_explore';
  }

  getDescription(): string {
    return `This endpoint will provide you with the keyword popularity data from DataForSEO Trends. You can check keyword trends for Google Search, Google News, and Google Shopping`;
  }

  getParams(): z.ZodRawShape {
    return {
      location_name: z.string().nullable().default(null).describe(`full name of the location
        optional field
        in format "Country"
        example:
        United Kingdom`),
      keywords: z.array(z.string()).describe(`keywords
        the maximum number of keywords you can specify: 5`),
      type: z.enum(['web', 'news', 'ecommerce']).default('web').describe(`dataforseo trends type`),
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
      time_range: z.enum(['past_4_hours', 'past_day', 'past_7_days', 'past_30_days', 'past_90_days', 'past_12_months', 'past_5_years'])
          .default('past_7_days')
          .describe(
            `preset time ranges
            if you specify date_from or date_to parameters, this field will be ignored when setting a task`),
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest('/v3/keywords_data/dataforseo_trends/explore/live', 'POST', [{
        location_name: params.location_name,
        keywords: params.keywords,
        type: params.type,
        date_from: params.date_from,
        date_to: params.date_to,
        time_range: params.time_range,
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 