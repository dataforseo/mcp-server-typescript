import { z } from 'zod';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';
import { BaseTool } from '../../base.tool.js';
import { mapArrayToNumberedKeys } from '../../../utils/map-array-to-numbered-keys.js';

export class BacklinksPageIntersectionTool extends BaseTool {
  constructor(private client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'backlinks_page_intersection';
  }

  getDescription(): string {
    return "This endpoint will provide you with the list of domains pointing to the specified websites. This endpoint is especially useful for creating a Link Gap feature that shows what domains link to your competitors but do not link out to your website";
  }

  getParams(): z.ZodRawShape {
    return {
      targets: z.array(z.string()).describe(`domains, subdomains or webpages to get links for
required field
you can set up to 20 domains, subdomains or webpages
a domain or a subdomain should be specified without https:// and www.
a page should be specified with absolute URL (including http:// or https://)`),
      limit: z.number().min(1).max(1000).default(10).optional().describe("the maximum number of returned results"),
      offset: z.number().min(0).optional().describe(
        `offset in the array of returned results
optional field
default value: 0
if you specify the 10 value, the first ten backlinks in the results array will be omitted and the data will be provided for the successive backlinks`
      ),
      filters: this.getFilterExpression().optional().describe(
        `Array-based filter expression. A single condition is a 3-element array: [field, operator, value]. Combine conditions with ["and"|"or"] between them: [condition, "and", condition]. Max 8 filters.
Operators: regex, not_regex, =, <>, in, not_in, like, not_like, ilike, not_ilike, match, not_match
Use % with like/not_like to match any string of zero or more characters.
Examples:
  Single: ["1.rank",">","80"]
  Combined: [["2.page_from_rank",">","55"],"and",["1.original","=","true"]]`
      ),
      order_by: z.array(z.string()).optional().describe(
        `results sorting rules
optional field
you can use the same values as in the filters array to sort the results
possible sorting types:
asc – results will be sorted in the ascending order
desc – results will be sorted in the descending order
you should use a comma to set up a sorting type
example:
["rank,desc"]
note that you can set no more than three sorting rules in a single request
you should use a comma to separate several sorting rules
example:
["domain_from_rank,desc","page_from_rank,asc"]`
      ),
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.client.makeRequest('/v3/backlinks/page_intersection/live', 'POST', [{
        targets: mapArrayToNumberedKeys(params.targets),
        limit: params.limit,
        offset: params.offset,
        filters: this.formatFilters(params.filters),
        order_by: this.formatOrderBy(params.order_by),
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 