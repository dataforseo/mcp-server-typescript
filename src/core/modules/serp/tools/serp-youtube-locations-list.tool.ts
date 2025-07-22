import { z } from 'zod';
import { BaseTool, DataForSEOFullResponse } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';
import { DataForSEOResponse } from '../../base.tool.js';


export class SerpYoutubeLocationsListTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getName(): string {
    return 'serp_youtube_locations';
  }

  getDescription(): string {
    return 'Utility tool to get list of available locations for: serp_youtube_organic_live_advanced, serp_youtube_video_info_live_advanced, serp_youtube_video_comments_live_advanced, serp_youtube_video_subtitles_live_advanced';
  }

  protected supportOnlyFullResponse(): boolean {
    return true;
  }

  getParams(): z.ZodRawShape {
    return {
      country_code: z.string().default('US').describe("country code (e.g., 'US')"),
    };
  }

  async handle(params:any): Promise<any> {
    try {
      console.error(JSON.stringify(params, null, 2));
      const response = await this.dataForSEOClient.makeRequest(`/v3/serp/youtube/locations/${params.country_code}`, 'GET', null, true) as DataForSEOFullResponse;
      this.validateResponseFull(response);
      return this.formatResponse(response.tasks[0].result.map(x => x.location_name));
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 