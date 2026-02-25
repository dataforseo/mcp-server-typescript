import { z } from 'zod';
import { BaseTool } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';
import { baseProperties } from '../../lighthouse-properties.js';

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
      custom_user_agent: z.string().optional().describe("Custom User-Agent header"),
      accept_language: z.string().optional().describe("Accept-Language header value"),
      result_properties: z.string().array().optional().describe("Specify which Lighthouse result properties to return. A list of available properties can be obtained using the on_page_lighthouse_helper tool."),
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

      if (params.result_properties && params.result_properties.length > 0) {

        const groupedResultProperties = (params.result_properties as any[]).reduce<Record<string, string[]>>((acc, item) => {
          const [key, value] = item.split(".");
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(value);
          return acc;
        }, {});

        (response.items as any[]).forEach(item => {
          Object.keys(item).forEach(key => {
            if (!groupedResultProperties[key] && baseProperties.findIndex(x => x == key) != -1) {
              delete item[key];
            }

            if (groupedResultProperties[key]) {
              let params = groupedResultProperties[key];
              Object.keys(item[key]).forEach(subKey => {
                if (!params.includes(subKey)) {
                  delete item[key][subKey];
                }
              });
            }
          });
        });
      }

      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
}
