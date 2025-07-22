import { z } from 'zod';
import { BaseTool } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';

export class SerpYoutubeOrganicLiveAdvancedTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getName(): string {
    return 'serp_youtube_organic_live_advanced';
  }

  getDescription(): string {
    return 'provides top 20 blocks of youtube search engine results for a keyword';
  }

  getParams(): z.ZodRawShape {
    return {
      keyword: z.string().describe("Search keyword"),
      location_name: z.string().describe(`full name of the location
required field
Location format - hierarchical, comma-separated (from most specific to least)
 Can be one of:
 1. Country only: "United States"
 2. Region,Country: "California,United States"
 3. City,Region,Country: "San Francisco,California,United States"`),
      language_code: z.string().describe("search engine language code (e.g., 'en')"),
      device: z.string().default('desktop').optional().describe(`device type
optional field
can take the values:desktop, mobile
default value: desktop`),
      os: z.string().default('windows').optional().describe(`device operating system
optional field
if you specify desktop in the device field, choose from the following values: windows, macos
default value: windows
if you specify mobile in the device field, choose from the following values: android, ios
default value: android`),
      block_depth: z.number().default(20).optional().describe(`parsing depth
optional field
number of blocks of results in SERP
max value: 700`)
    };
  }

  async handle(params:any): Promise<any> {
    try {
      console.error(JSON.stringify(params, null, 2));
      const response = await this.dataForSEOClient.makeRequest(`/v3/serp/youtube/organic/live/advanced`, 'POST', [{
        keyword: params.keyword,
        location_name: params.location_name,
        language_code: params.language_code,
        device: params.device,
        os: params.os,
        block_depth: params.block_depth,
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 

