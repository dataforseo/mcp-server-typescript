import { BaseModule, ToolDefinition } from '../base.module.js';
import { PromptDefinition } from '../prompt-definition.js';
import { AiOptimizationKeywordDataLocationsAndLanguagesListTool } from './tools/keyword-data/ai-optimization-keyword-data-locations-and-languages.js';
import { AiOptimizationKeywordDataSearchVolumeTool } from './tools/keyword-data/ai-optimization-keyword-data-search-volume.js'
import { AiOptimizationLlmMentionsFiltersTool } from './tools/llm-mentions/filters.js';
import { AiOptimizationLlmMentionsAggregatedMetricsTool } from './tools/llm-mentions/llm-mentions-aggregated-metrics.js';
import { AiOptimizationLlmMentionsCrossAggregatedMetricsTool } from './tools/llm-mentions/llm-mentions-cross-aggregated-metrics.js';
import { AiOptimizationLlmMentionsSearchTool } from './tools/llm-mentions/llm-mentions-search.js';
import { AiOptimizationLlmMentionsTopDomainsTool } from './tools/llm-mentions/llm-mentions-top-domains.js';
import { AiOptimizationLlmMentionsTopPagesTool } from './tools/llm-mentions/llm-mentions-top-pages.js';
import { AiOptimizationLlmMentionsLocationsAndLanguagesListTool } from './tools/llm-mentions/locations-and-languages.js';
import { AiOptimizationChatGptLocationsTool } from './tools/llms/chat-gpt/cha-gpt-locations.js';
import { AiOptimizationChatGptScraperTool } from './tools/llms/chat-gpt/chat-gpt-scraper.js';
import { AiOptimizationLlmModelsTool } from './tools/llms/llm-models.js';
import { AiOptimizationLlmResponseTool } from './tools/llms/llm-response.js';

export class AiOptimizationApiModule extends BaseModule {
  getTools(): Record<string, ToolDefinition> {
    const tools = [
      new AiOptimizationKeywordDataLocationsAndLanguagesListTool(this.dataForSEOClient),
      new AiOptimizationKeywordDataSearchVolumeTool(this.dataForSEOClient),

      new AiOptimizationLlmModelsTool(this.dataForSEOClient),
      new AiOptimizationLlmResponseTool(this.dataForSEOClient),

      new AiOptimizationLlmMentionsFiltersTool(this.dataForSEOClient),
      new AiOptimizationLlmMentionsLocationsAndLanguagesListTool(this.dataForSEOClient),
      new AiOptimizationLlmMentionsSearchTool(this.dataForSEOClient),
      new AiOptimizationLlmMentionsAggregatedMetricsTool(this.dataForSEOClient),
      new AiOptimizationLlmMentionsCrossAggregatedMetricsTool(this.dataForSEOClient),
      new AiOptimizationLlmMentionsTopDomainsTool(this.dataForSEOClient),
      new AiOptimizationLlmMentionsTopPagesTool(this.dataForSEOClient),

      new AiOptimizationChatGptScraperTool(this.dataForSEOClient),
      new AiOptimizationChatGptLocationsTool(this.dataForSEOClient),
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