import { BaseModule, ToolDefinition } from '../base.module.js';
import { PromptDefinition } from '../prompt-definition.js';
import { businessDataPrompts } from './business-data.prompt.js';
import { BusinessDataBusinessListingsSearchTool } from './tools/listings/business-listings-search.tool.js';

export class BusinessDataApiModule extends BaseModule {
  getTools(): Record<string, ToolDefinition> {
    const tools = [
      new BusinessDataBusinessListingsSearchTool(this.dataForSEOClient),
      // Add more tools here
    ];

    return tools.reduce((acc, tool) => ({
      ...acc,
      [tool.getName()]: {
        description: tool.getDescription(),
        params: tool.getParams(),
        handler: (params: any) => tool.handle(params),
      },
    }), {});
  }

    getPrompts(): Record<string, PromptDefinition> {
      return businessDataPrompts.reduce((acc, prompt) => ({
        ...acc,
        [prompt.name]: {
          description: prompt.description,
          params: prompt.params,
          handler: (params: any) => {

            return prompt.handler(params);
          },
        },
      }), {});
    }
} 