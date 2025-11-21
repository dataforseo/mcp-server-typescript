import z from "zod";
import { DataForSEOClient } from "../../../../client/dataforseo.client.js";
import { BaseTool, DataForSEOFullResponse } from "../../../base.tool.js";



export class AiOptimizationLlmMentionsFiltersTool extends BaseTool {

  private static cache: { [field: string]: string } = {};
  private static lastFetchTime: number = 0;
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor(private client: DataForSEOClient) {
    super(client);
  }
  
  getName(): string {
      return "ai_optimization_llm_mentions_filters";
  }

  getDescription(): string {
      return "This endpoint provides all the necessary information about filters that can be used with AI Optimization LLM Mentions API endpoints";
  }

  getParams(): z.ZodRawShape {
    return { };
  }

    private async fetchAndCacheFilters(): Promise<{ [field: string]: string }> {
      const now = Date.now();
      
      // Return cached data if it's still valid
      if (AiOptimizationLlmMentionsFiltersTool.cache && 
          (now - AiOptimizationLlmMentionsFiltersTool.lastFetchTime) < AiOptimizationLlmMentionsFiltersTool.CACHE_TTL) {
        return AiOptimizationLlmMentionsFiltersTool.cache;
      }
  
      // Fetch fresh data
      const response = await this.client.makeRequest('/v3/ai_optimization/llm_mentions/available_filters', 'GET', null, true) as DataForSEOFullResponse;
      this.validateResponseFull(response);
  
      const result = response.tasks[0].result[0];
      const filters = result['search'];
      
      // Update cache
      AiOptimizationLlmMentionsFiltersTool.cache = filters;
      AiOptimizationLlmMentionsFiltersTool.lastFetchTime = now;
  
      return filters;
    }

  async handle(params: any): Promise<any> {
    try {
        
      const filters = await this.fetchAndCacheFilters();
      return this.formatResponse(filters);

    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
}