import z from "zod";
import { DataForSEOClient } from "../../../../client/dataforseo.client.js";
import { BaseTool } from "../../../base.tool.js";

export class AiOptimizationLlmResponseTool extends BaseTool {

  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }
  
  getName(): string {
      return "ai_optimization_llm_response";
  }

  getDescription(): string {
      return "This endpoint allows you to retrieve structured responses from a specific AI model, based on the input parameters";
  }

  getParams(): z.ZodRawShape {
    return {
      llm_type: z.string().describe(`type of llm. Must be one of: 'claude', 'gemini', 'chat_gpt', 'perplexity'`),
      user_prompt: z.string().describe("Prompt for the AI model. The question or task you want to send to the AI model. You can specify up to 500 characters in the user_prompt field"),
      model_name: z.string().describe(`name of the AI model. consists of the actual model name and version name. if not sure which model to use, first call the ai_optimization_llm_models tool to get list of available models for the specified llm_type`),
      temperature: z.number().optional().describe("randomness of the AI response optional field higher values make output more diverse; lower values make output more focused;"),
      top_p: z.number().optional().describe("diversity of the AI response, optional field, controls diversity of the response by limiting token selection;"),
      web_search: z.boolean().optional().describe("enable web search for current information. When enabled, the AI model can access and cite current web information;"),
    };
  }

  async handle(params: any): Promise<any> {
    try {

        const payload: any = {
            user_prompt: params.user_prompt,
            model_name: params.model_name,
        };

        if (params.temperature) {
            payload.temperature = params.temperature;
        }
        if (params.top_p) {
            payload.top_p = params.top_p;
        }
        if (params.web_search) {
            payload.web_search = params.web_search;
        }
        
        const response = await this.dataForSEOClient.makeRequest(`/v3/ai_optimization/${params.llm_type}/llm_responses/live`, 'POST', [payload], true);
        return this.validateAndFormatResponse(response);
    } catch (error) {
        return this.formatErrorResponse(error);
    }
  }

}