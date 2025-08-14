import { BaseModule, ToolDefinition } from '../base.module.js';
import { PromptDefinition } from '../prompt-definition.js';
import { AiOptimizationKeywordDataLocationsAndLanguagesListTool } from './tools/keyword-data/ai-optimization-keyword-data-locations-and-languages.js';
import { AiOptimizationKeywordDataSearchVolumeTool } from './tools/keyword-data/ai-optimization-keyword-data-search-volume.js'

export class AiOptimizationApiModule extends BaseModule {
  getTools(): Record<string, ToolDefinition> {
    const tools = [
      new AiOptimizationKeywordDataLocationsAndLanguagesListTool(this.dataForSEOClient),
      new AiOptimizationKeywordDataSearchVolumeTool(this.dataForSEOClient),
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
      return {};
    }
} 