import { DataForSEOClient } from "../../../../client/dataforseo.client.js";
import { BaseTool } from "../../../base.tool.js";
import { z } from 'zod';

export class AiOptimizationLlmModelsTool extends BaseTool {

  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }
  
  getName(): string {
      return "ai_optimization_llm_models";
  }

  getDescription(): string {
      return "Utility tool for ai_optimization_llm_response to get list of availible locations and languages";
  }

  getParams(): z.ZodRawShape {
    return {
          llm_type: z.string().describe(`type of llm. Must be one of: 'claude', 'gemini', 'chat_gpt', 'perplexity'`),
         };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest(`/v3/ai_optimization/${params.llm_type}/llm_responses/models`, 'GET', null, true);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
}