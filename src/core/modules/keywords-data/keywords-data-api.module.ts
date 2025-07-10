import { BaseModule, ToolDefinition } from '../base.module.js';
import { DataForSeoTrendsDemographyTool } from './tools/dataforseo-trends/dataforseo-trends-demography.tool.js';
import { DataForSeoTrendsExploreTool } from './tools/dataforseo-trends/dataforseo-trends-explore.tool.js';
import { DataForSeoTrendsSubregionInterestsTool } from './tools/dataforseo-trends/dataforseo-trends-subregion-interests.tool.js';
import { GoogleAdsSearchVolumeTool } from './tools/google-ads/google-ads-search-volume.tool.js';
import { GoogleTrendsCategoriesTool } from './tools/google-trends/google-trends-categories.tool.js';
import { GoogleTrendsExploreTool } from './tools/google-trends/google-trends-explore.tool.js';

export class KeywordsDataApiModule extends BaseModule {
  getTools(): Record<string, ToolDefinition> {
    const tools = [
      new GoogleAdsSearchVolumeTool(this.dataForSEOClient),

      new DataForSeoTrendsDemographyTool(this.dataForSEOClient),
      new DataForSeoTrendsSubregionInterestsTool(this.dataForSEOClient),
      new DataForSeoTrendsExploreTool(this.dataForSEOClient),

      new GoogleTrendsCategoriesTool(this.dataForSEOClient),
      new GoogleTrendsExploreTool(this.dataForSEOClient),
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