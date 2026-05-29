import { BaseModule, buildToolsRecord, ToolDefinition } from '../base.module.js';
import { PromptDefinition } from '../prompt-definition.js';
import { BusinessDataBusinessListingsSearchTool } from './tools/listings/business-listings-search.tool.js';

export class BusinessDataApiModule extends BaseModule {
  getTools(): Record<string, ToolDefinition> {
    const tools = [
      new BusinessDataBusinessListingsSearchTool(this.dataForSEOClient),
      // Add more tools here
    ];

    return buildToolsRecord(tools);
  }

    getPrompts(): Record<string, PromptDefinition> {
      return {}
    }
} 