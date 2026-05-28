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
    return 'Utility tool to get list of available locations for: serp_youtube_organic_live_advanced, serp_youtube_video_info_live_advanced, serp_youtube_video_comments_live_advanced, serp_youtube_video_subtitles_live_advanced.';
  }

  getTitle(): string {
    return 'SERP YouTube Locations';
  }
  
  getParams(): z.ZodRawShape {
    return {
      country_iso_code: z.string().describe("ISO 3166-1 alpha-2 country code, for example: US, GB, MT"),
      location_type: z.string().optional().describe("Type of location. Possible variants: 'TV Region','Postal Code','Neighborhood','Governorate','National Park','Quarter','Canton','Airport','Okrug','Prefecture','City','Country','Province','Barrio','Sub-District','Congressional District','Municipality District','district','DMA Region','Union Territory','Territory','Colloquial Area','Autonomous Community','Borough','County','State','District','City Region','Commune','Region','Department','Division','Sub-Ward','Municipality','University'"),
      location_name: z.string().optional().describe("Name of location or it`s part.")
    };
  }

  async handle(params:any): Promise<any> {
    try {

     const payload: Record<string, unknown> = {
        'country_iso_code': params.country_iso_code,
      };

      if (params.location_type) {
        payload['location_type'] = params.location_type;
      }

      if (params.location_name) {
        payload['location_name'] = params.location_name;
      }

      const response = await this.dataForSEOClient.makeRequest(`/v3/serp/youtube/locations`, 'POST', [payload]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 