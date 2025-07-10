import { z } from 'zod';
import { BaseTool, DataForSEOFullResponse } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';
import { DataForSEOResponse } from '../../base.tool.js';
import { defaultGlobalToolConfig } from '../../../config/global.tool.js';

export class ContentParsingTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getName(): string {
    return 'on_page_content_parsing';
  }

  getDescription(): string {
    return 'This endpoint allows parsing the content on any page you specify and will return the structured content of the target page, including link URLs, anchors, headings, and textual content.';
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
      const response = await this.dataForSEOClient.makeRequest('/v3/on_page/content_parsing/live', 'POST', [{
        url: params.url,
        enable_javascript: params.enable_javascript,
        custom_js: params.custom_js,
        custom_user_agent: params.custom_user_agent,
        accept_language: params.accept_language,
        markdown_view: true
      }]);
      console.error(JSON.stringify(response));
      if(defaultGlobalToolConfig.fullResponse || this.supportOnlyFullResponse()){
        let data = response as DataForSEOFullResponse;
        this.validateResponseFull(data);
        let result = data.tasks[0].result;
        return this.formatResponse(result);
      }
      else{
        let data = response as DataForSEOResponse;
        this.validateResponse(data);
        let result = data.items[0].page_as_markdown;
        return this.formatResponse(result);
      }
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 