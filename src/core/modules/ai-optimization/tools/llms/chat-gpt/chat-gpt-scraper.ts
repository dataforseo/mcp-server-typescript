import { z } from 'zod';
import { ZodRawShape } from 'zod';
import { DataForSEOClient } from '../../../../../client/dataforseo.client.js';
import { BaseTool } from '../../../../base.tool.js';

export class AiOptimizationChatGptScraperTool extends BaseTool {

  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }
  
  getName(): string {
      return "ai_optimization_chat_gpt_scraper";
  }

  getDescription(): string {
      return "This endpoint provides results from ChatGPT searches";
  }

  getParams(): z.ZodRawShape {
    return {
      keyword: z.string().describe(`keyword
required field
you can specify up to 2000 characters in the keyword field
all %## will be decoded (plus character ‘+’ will be decoded to a space character)
if you need to use the “%” character for your keyword, please specify it as “%25”;
if you need to use the “+” character for your keyword, please specify it as “%2B”`),
      location_name: z.string().default('United States').describe(`full name of the location, example: 'United Kingdom', 'United States'`),
      language_code: z.string().describe("Search engine language code (e.g., 'en')"),
      force_web_search: z.boolean().optional().describe("force AI agent to use web search"),
    };
  }

  async handle(params: any): Promise<any> {
    try {
        
        let paylaod: any = {
            keyword: params.keyword,
            location_name: params.location_name,
            language_code: params.language_code,
        };

        if (params.force_web_search ) {
            paylaod.force_web_search = params.force_web_search;
        }


      const response = await this.dataForSEOClient.makeRequest(`/v3/ai_optimization/chat_gpt/llm_scraper/live/advanced`, 'POST', [paylaod]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

}