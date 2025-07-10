import { BaseModule, ToolDefinition } from '../base.module.js';
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
} 