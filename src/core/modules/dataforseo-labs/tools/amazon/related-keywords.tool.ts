import { z } from 'zod';
import { DataForSEOClient } from '../../../../client/dataforseo.client.js';
import { BaseTool } from '../../../base.tool.js';

export class AmazonRelatedKeywordsTool extends BaseTool {
  constructor(client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'dataforseo_labs_amazon_related_keywords';
  }

  getDescription(): string {
    return `The Related Keywords endpoint provides keywords appearing in the "Related Searches" section on Amazon. You can get up to 1554 keyword ideas by specifying the search depth. Each related keyword comes with search volume information.`;
  }

  getTitle(): string {
    return 'DataForSEO Labs Amazon Related Keywords';
  }

  getParams(): z.ZodRawShape {
    return {
      keyword: z.string().describe(`target keyword
required field
UTF-8 encoding
the keyword should be specified in the lowercase format`),
      depth: z.number().min(0).max(4).default(1).describe(`keyword search depth
optional field
default value: 1
you can specify a level from 0 to 4
estimated number of keywords for each level (maximum):
0 – the keyword set in the keyword field
1 – 6 keywords
2 – 42 keywords
3 – 258 keywords
4 – 1554 keywords`),
      location_name: z.string().default("United States").describe(`full name of the location
required field if location_code is not specified
Note: this endpoint currently supports the US, Egypt, Saudi Arabia, and the United Arab Emirates locations only
example: 'United States'`),
      language_code: z.string().default("en").describe(
        `language code
        required field if language_name is not specified
        example:
        en`),
      include_seed_keyword: z.boolean().default(false).optional().describe(
        `include data for the seed keyword
optional field
if set to true, data for the seed keyword specified in the keyword field will be provided in the seed_keyword_data array of the response
default value: false`),
      ignore_synonyms: z.boolean().default(false).optional().describe(
        `ignore highly similar keywords
optional field
if set to true only core keywords will be returned, all highly similar keywords will be excluded
default value: false`),
      limit: z.number().min(1).max(1000).default(100).optional().describe("Maximum number of keywords to return"),
      offset: z.number().min(0).optional().describe(
        `offset in the results array of returned keywords
        optional field
        default value: 0
        if you specify the 10 value, the first ten keywords in the results array will be omitted and the data will be provided for the successive keywords`
      ),
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest('/v3/dataforseo_labs/amazon/related_keywords/live', 'POST', [{
        keyword: params.keyword,
        location_name: params.location_name,
        language_code: params.language_code,
        depth: params.depth,
        include_seed_keyword: params.include_seed_keyword,
        ignore_synonyms: params.ignore_synonyms,
        limit: params.limit,
        offset: params.offset,
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
}
