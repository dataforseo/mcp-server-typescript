import { DataForSEOClient } from '../../client/dataforseo.client.js';
import { BaseModule, ToolDefinition } from '../base.module.js';
import { BacklinksAnchorTool } from './tools/backlinks-anchor.tool.js';
import { BacklinksTool } from './tools/backlinks-backlinks.tool.js';
import { BacklinksBulkBacklinksTool } from './tools/backlinks-bulk-backlinks.tool.js';
import { BacklinksBulkNewLostBacklinksTool } from './tools/backlinks-bulk-new-lost-backlinks.tool.js';
import { BacklinksBulkNewLostReferringDomainsTool } from './tools/backlinks-bulk-new-lost-referring-domains.tool.js';
import { BacklinksBulkPagesSummaryTool } from './tools/backlinks-bulk-pages-summary.js';
import { BacklinksBulkRanksTool } from './tools/backlinks-bulk-ranks.tool.js';
import { BacklinksBulkReferringDomainsTool } from './tools/backlinks-bulk-referring-domains.tool.js';
import { BacklinksBulkSpamScoreTool } from './tools/backlinks-bulk-spam-score.tool.js';
import { BacklinksCompetitorsTool } from './tools/backlinks-competitors.tool.js';
import { BacklinksDomainIntersectionTool } from './tools/backlinks-domain-intersection.tool.js';
import { BacklinksDomainPagesSummaryTool } from './tools/backlinks-domain-pages-summary.tool.js';
import { BacklinksDomainPagesTool } from './tools/backlinks-domain-pages.tool.js';
import { BacklinksFiltersTool } from './tools/backlinks-filters.tool.js';
import { BacklinksPageIntersectionTool } from './tools/backlinks-page-intersection.tool.js';
import { BacklinksReferringDomainsTool } from './tools/backlinks-referring-domains.tool.js';
import { BacklinksReferringNetworksTool } from './tools/backlinks-referring-networks.tool.js';
import { BacklinksSummaryTool } from './tools/backlinks-summary.tool.js';
import { BacklinksTimeseriesNewLostSummaryTool } from './tools/backlinks-timeseries-new-lost-summary.tool.js';
import { BacklinksTimeseriesSummaryTool } from './tools/backlinks-timeseries-summary.tool.js';

export class BacklinksApiModule extends BaseModule {
  constructor(client: DataForSEOClient) {
    super(client);
  }

  getTools(): Record<string, ToolDefinition> {
    const tools = [
      new BacklinksTool(this.dataForSEOClient),
      new BacklinksAnchorTool(this.dataForSEOClient),
      new BacklinksBulkBacklinksTool(this.dataForSEOClient),
      new BacklinksBulkNewLostReferringDomainsTool(this.dataForSEOClient),
      new BacklinksBulkNewLostBacklinksTool(this.dataForSEOClient),
      new BacklinksBulkRanksTool(this.dataForSEOClient),
      new BacklinksBulkReferringDomainsTool(this.dataForSEOClient),
      new BacklinksBulkSpamScoreTool(this.dataForSEOClient),
      new BacklinksCompetitorsTool(this.dataForSEOClient),
      new BacklinksDomainIntersectionTool(this.dataForSEOClient),
      new BacklinksDomainPagesSummaryTool(this.dataForSEOClient),
      new BacklinksDomainPagesTool(this.dataForSEOClient),
      new BacklinksPageIntersectionTool(this.dataForSEOClient),
      new BacklinksReferringDomainsTool(this.dataForSEOClient),
      new BacklinksReferringNetworksTool(this.dataForSEOClient),
      new BacklinksSummaryTool(this.dataForSEOClient),
      new BacklinksTimeseriesNewLostSummaryTool(this.dataForSEOClient),
      new BacklinksTimeseriesSummaryTool(this.dataForSEOClient),
      new BacklinksBulkPagesSummaryTool(this.dataForSEOClient),
      new BacklinksFiltersTool(this.dataForSEOClient)
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