import { z } from 'zod';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';
import { BaseTool } from '../../base.tool.js';

export class InstantPagesTool extends BaseTool {
  constructor(client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'on_page_instant_pages';
  }

  getDescription(): string {
    return "Using this function you will get page-specific data with detailed information on how well a particular page is optimized for organic search";
  }

  getTitle(): string {
    return 'On Page Instant Pages';
  }

  getParams(): z.ZodRawShape {
    return {
      url: z.string().describe("URL to analyze"),
      enable_javascript: z.boolean().optional().describe("Enable JavaScript rendering"),
      custom_js: z.string().optional().describe("Custom JavaScript code to execute"),
      custom_user_agent: z.string().optional().describe("Custom User-Agent header")    };
  }

  async handle(params: { 
    url: string; 
    enable_javascript?: boolean; 
    custom_js?: string; 
    custom_user_agent?: string;
  }): Promise<any> {
    try {
        const response = await this.dataForSEOClient.makeRequest('/v3/on_page/instant_pages', 'POST', [{
          url: params.url,
          enable_javascript: params.enable_javascript,
          custom_js: params.custom_js,
          custom_user_agent: params.custom_user_agent
        }]);
        return this.validateAndFormatResponse(response);
      } catch (error) {
        return this.formatErrorResponse(error);
      }
  }
} 