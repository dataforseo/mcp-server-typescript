import { BaseModule, ToolDefinition } from '../base.module.js';
import { PromptDefinition } from '../prompt-definition.js';
import { contentAnalysisPrompts } from './content-analysis.prompt.js';
import { ContentAnalysisPhraseTrendsTool } from './tools/content-analysis-phrase-trends.js';
import { ContentAnalysisSearchTool } from './tools/content-analysis-search.tool.js';
import { ContentAnalysisSummaryTool } from './tools/content-analysis-summary.js';

export class ContentAnalysisApiModule extends BaseModule {
  getTools(): Record<string, ToolDefinition> {
    const tools = [
      new ContentAnalysisSearchTool(this.dataForSEOClient),
      new ContentAnalysisSummaryTool(this.dataForSEOClient),
      new ContentAnalysisPhraseTrendsTool(this.dataForSEOClient),
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
    return contentAnalysisPrompts.reduce((acc, prompt) => ({
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