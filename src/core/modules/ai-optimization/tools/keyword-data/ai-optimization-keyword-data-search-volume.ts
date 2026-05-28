import { z } from 'zod';
import { BaseTool, DataForSEOFullResponse } from '../../../base.tool.js';
import { DataForSEOClient } from '../../../../client/dataforseo.client.js';
import { ZodRawShape } from 'zod';

export class AiOptimizationKeywordDataSearchVolumeTool extends BaseTool {

  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }
  
  getName(): string {
      return "ai_optimization_keyword_data_search_volume";
  }

  getDescription(): string {
      return "This endpoint provides search volume data for your target keywords, reflecting their estimated usage in AI LLMs";
  }

  getTitle(): string {
    return 'AI Optimization Keyword Data Search Volume';
  }

  getParams(): z.ZodRawShape {
    return {
      keywords: z.array(z.string()).describe("Keywords. The maximum number of keywords you can specify: 1000"),
      location_name: z.string().default('United States').describe(`full name of the location, example: 'United Kingdom', 'United States'`),
      language_code: z.string().describe("Search engine language code (e.g., 'en')"),
    };
  }

  async handle(params: any): Promise<any> {
    try {
      console.error(JSON.stringify(params, null, 2));
      const response = await this.dataForSEOClient.makeRequest(`/v3/ai_optimization/ai_keyword_data/keywords_search_volume/live`, 'POST', [{
        keywords: params.keywords,
        location_name: params.location_name,
        language_code: params.language_code
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

}