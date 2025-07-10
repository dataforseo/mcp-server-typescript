import { BaseModule, ToolDefinition } from '../base.module.js';
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
} 