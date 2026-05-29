import { BaseModule, buildToolsRecord, ToolDefinition } from '../base.module.js';
import { PromptDefinition } from '../prompt-definition.js';
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

    return buildToolsRecord(tools);
  }

  getPrompts(): Record<string, PromptDefinition> {
    return {}
  }
} 