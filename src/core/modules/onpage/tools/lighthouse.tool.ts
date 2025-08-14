import { z } from 'zod';
import { BaseTool, DataForSEOFullResponse } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';
import { DataForSEOResponse } from '../../base.tool.js';
import { defaultGlobalToolConfig } from '../../../config/global.tool.js';

export class LighthouseTool extends BaseTool {
  constructor(private client: DataForSEOClient) {
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
      custom_js: z.string().optional().describe("Custom JavaScript code to execute"),
      custom_user_agent: z.string().optional().describe("Custom User-Agent header"),
      accept_language: z.string().optional().describe("Accept-Language header value"),
    };
  }

  async handle(params: { 
    url: string; 
    enable_javascript?: boolean; 
    custom_js?: string; 
    custom_user_agent?: string; 
    accept_language?: string; 
  }): Promise<any> {
    try {
        const response = await this.dataForSEOClient.makeRequest('/v3/on_page/lighthouse/live/json', 'POST', [{
          url: params.url,
          enable_javascript: params.enable_javascript,
          custom_js: params.custom_js,
          custom_user_agent: params.custom_user_agent,
          accept_language: params.accept_language,
        }]);
        return this.validateAndFormatResponse(response);
      } catch (error) {
        return this.formatErrorResponse(error);
      }
  }
} 
