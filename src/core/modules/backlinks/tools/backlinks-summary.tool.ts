import { z } from 'zod';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';
import { BaseTool } from '../../base.tool.js';

export class BacklinksSummaryTool extends BaseTool {
  constructor(private client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'backlinks_summary';
  }

  getDescription(): string {
    return "This endpoint will provide you with an overview of backlinks data available for a given domain, subdomain, or webpage";
  }

  getParams(): z.ZodRawShape {
    return {
      target: z.string().describe(`domain, subdomain or webpage to get backlinks for
        required field
a domain or a subdomain should be specified without https:// and www.
a page should be specified with absolute URL (including http:// or https://)`),
      include_subdomains: z.boolean().optional().describe(`indicates if indirect links to the target will be included in the results
if set to true, the results will include data on indirect links pointing to a page that either redirects to the target, or points to a canonical page
if set to false, indirect links will be ignored`).default(true),
      exclude_internal_backlinks: z.boolean().optional().describe(`indicates if internal backlinks from subdomains to the target will be excluded from the results
if set to true, the results will not include data on internal backlinks from subdomains of the same domain as target
if set to false, internal links will be included in the results`).default(true)
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.client.makeRequest('/v3/backlinks/summary/live', 'POST', [{
        target: params.target,
        include_subdomains: params.include_subdomains,
        exclude_internal_backlinks: params.exclude_internal_backlinks
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 