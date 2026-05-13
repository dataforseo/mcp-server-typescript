import { z } from 'zod';
import { BaseTool } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';

export class LighthouseTool extends BaseTool {
  constructor(client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'on_page_lighthouse';
  }

  getDescription(): string {
    return 'The OnPage Lighthouse API is based on Google’s open-source Lighthouse project for measuring the quality of web pages and web apps.';
  }

  getParams(): z.ZodRawShape {
    return {
      url: z.string().describe("URL of the page to parse"),
      enable_javascript: z.boolean().optional().describe("Enable JavaScript rendering"),
      custom_user_agent: z.string().optional().describe("Custom User-Agent header"),
      accept_language: z.string().optional().describe("Accept-Language header value"),
      full_data: z.boolean().optional().describe("Return the complete API response instead of a reduced version"),
    };
  }

  async handle(params: any): Promise<any> {
    try {
        let response = await this.dataForSEOClient.makeRequest<any>('/v3/on_page/lighthouse/live/json', 'POST', [{
          url: params.url,
          enable_javascript: params.enable_javascript,
          custom_user_agent: params.custom_user_agent,
          accept_language: params.accept_language,
        }]);
       
        return this.validateAndFormatResponse(response, params.full_data ?? false);
      } catch (error) {
        return this.formatErrorResponse(error);
      }
  }
}
