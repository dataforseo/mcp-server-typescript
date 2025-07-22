import { BaseModule, ToolDefinition } from '../base.module.js';
import { z } from 'zod';
import { SerpOrganicLiveAdvancedTool } from './tools/serp-organic-live-advanced.tool.js';
import { SerpOrganicLocationsListTool } from './tools/serp-organic-locations-list.tool.js';
import { SerpYoutubeOrganicLiveAdvancedTool } from './tools/serp-youtube-organic-live-advanced.tool.js';
import { SerpYoutubeVideoInfoLiveAdvancedTool } from './tools/serp-youtube-video-info-live-advanced.tool.js';
import { SerpYoutubeVideoCommentsLiveAdvancedTool } from './tools/serp-youtube-video-comments-live-advanced-tool.js';
import { SerpYoutubeVideoSubtitlesLiveAdvancedTool } from './tools/serp-youtube-video-subtitles-live-advanced-tool.js';
import { SerpYoutubeLocationsListTool } from './tools/serp-youtube-locations-list.tool.js';

export class SerpApiModule extends BaseModule {
  getTools(): Record<string, ToolDefinition> {
    const tools = [
      new SerpOrganicLiveAdvancedTool(this.dataForSEOClient),
      new SerpOrganicLocationsListTool(this.dataForSEOClient),

      new SerpYoutubeLocationsListTool(this.dataForSEOClient),
      new SerpYoutubeOrganicLiveAdvancedTool(this.dataForSEOClient),
      new SerpYoutubeVideoInfoLiveAdvancedTool(this.dataForSEOClient),
      new SerpYoutubeVideoCommentsLiveAdvancedTool(this.dataForSEOClient),
      new SerpYoutubeVideoSubtitlesLiveAdvancedTool(this.dataForSEOClient),
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