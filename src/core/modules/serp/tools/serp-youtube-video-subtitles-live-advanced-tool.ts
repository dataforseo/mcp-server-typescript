import { z } from 'zod';
import { BaseTool } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';

export class SerpYoutubeVideoSubtitlesLiveAdvancedTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getName(): string {
    return 'serp_youtube_video_subtitles_live_advanced';
  }

  getDescription(): string {
    return 'provides data on the video subtitles you specify';
  }

  getParams(): z.ZodRawShape {
    return {
      video_id: z.string().describe("ID of the video"),
      location_name: z.string().describe(`full name of the location
required field
Location format - hierarchical, comma-separated (from most specific to least)
 Can be one of:
 1. Country only: "United States"
 2. Region,Country: "California,United States"
 3. City,Region,Country: "San Francisco,California,United States"`),
      language_code: z.string().describe("search engine language code (e.g., 'en')"),
      subtitles_language: z.string().optional().describe("language code of original text (e.g., 'en')"),
      subtitles_translate_language: z.string().optional().describe("language code of translated text (e.g., 'en')"),
      device: z.string().default('desktop').optional().describe(`device type
optional field
can take the values:desktop, mobile
default value: desktop`),
      os: z.string().default('windows').optional().describe(`device operating system
optional field
if you specify desktop in the device field, choose from the following values: windows, macos
default value: windows
if you specify mobile in the device field, choose from the following values: android, ios
default value: android`)
    };
  }

  async handle(params:any): Promise<any> {
    try {
      console.error(JSON.stringify(params, null, 2));
      const response = await this.dataForSEOClient.makeRequest(`/v3/serp/youtube/video_subtitles/live/advanced`, 'POST', [{
        video_id: params.video_id,
        location_name: params.location_name,
        language_code: params.language_code,
        subtitles_language: params.subtitles_language,
        subtitles_translate_language: params.subtitles_translate_language,
        device: params.device,
        os: params.os,
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 


