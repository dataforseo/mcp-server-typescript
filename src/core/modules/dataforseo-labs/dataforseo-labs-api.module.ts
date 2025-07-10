import { DataForSEOClient } from '../../client/dataforseo.client.js';
import { BaseModule, ToolDefinition } from '../base.module.js';
import { GoogleDomainCompetitorsTool } from './tools/google/competitor-research/google-domain-competitors.tool.js';
import { GoogleDomainRankOverviewTool } from './tools/google/competitor-research/google-domain-rank-overview.tool.js';
import { GoogleKeywordsIdeasTool } from './tools/google/keyword-research/google-keywords-ideas.tool.js';
import { GoogleKeywordsSuggestionsTool } from './tools/google/keyword-research/google-keywords-suggestions.tool.js';
import { GoogleRankedKeywordsTool } from './tools/google/competitor-research/google-ranked-keywords.tool.js';
import { GoogleRelatedKeywordsTool } from './tools/google/keyword-research/google-related-keywords.tool.js';
import { GoogleBulkKeywordDifficultyTool } from './tools/google/keyword-research/google-bulk-keyword-difficulty.tool.js';
import { GoogleTopSearchesTool } from './tools/google/market-analysis/google-top-searches.tool.js';
import { GoogleKeywordOverviewTool } from './tools/google/keyword-research/google-keyword-overview.tool.js';
import { GoogleKeywordsForSiteTool } from './tools/google/keyword-research/google-keywords-for-site.tool.js';
import { GoogleSubdomainsTool } from './tools/google/competitor-research/google-subdomains.js';
import { GoogleSERPCompetitorsTool } from './tools/google/competitor-research/google-serp-competitors.tool.js';
import { GoogleHistoricalSERP } from './tools/google/competitor-research/google-historical-serp.js';
import { GoogleSearchIntentTool } from './tools/google/keyword-research/google-search-intent.tool.js';
import { GoogleDomainIntersectionsTool } from './tools/google/competitor-research/google-domain-intersection.tool.js';
import { GoogleHistoricalDomainRankOverviewTool } from './tools/google/competitor-research/google-historical-domain-rank-overview.tool.js';
import { GooglePageIntersectionsTool } from './tools/google/competitor-research/google-page-intersection.tool.js';
import { DataForSeoLabsFilterTool } from './tools/labs-filters.tool.js';
import { GoogleBulkTrafficEstimationTool } from './tools/google/competitor-research/google-bulk-traffic-estimation.tool.js';
import { GoogleHistoricalKeywordDataTool } from './tools/google/keyword-research/google-historical-keyword-data.tool.js';

export class DataForSEOLabsApi extends BaseModule {
  constructor(client: DataForSEOClient) {
    super(client);
  }

  getTools(): Record<string, ToolDefinition> {
    const tools = [
      new GoogleRankedKeywordsTool(this.dataForSEOClient),
      new GoogleDomainCompetitorsTool(this.dataForSEOClient),
      new GoogleDomainRankOverviewTool(this.dataForSEOClient),
      new GoogleKeywordsIdeasTool(this.dataForSEOClient),
      new GoogleRelatedKeywordsTool(this.dataForSEOClient),
      new GoogleKeywordsSuggestionsTool(this.dataForSEOClient),
      new GoogleHistoricalSERP(this.dataForSEOClient),
      new GoogleSERPCompetitorsTool(this.dataForSEOClient),
      new GoogleBulkKeywordDifficultyTool(this.dataForSEOClient),
      new GoogleSubdomainsTool(this.dataForSEOClient),
      new GoogleKeywordOverviewTool(this.dataForSEOClient),
      new GoogleTopSearchesTool(this.dataForSEOClient),
      new GoogleSearchIntentTool(this.dataForSEOClient),
      new GoogleKeywordsForSiteTool(this.dataForSEOClient),
      new GoogleDomainIntersectionsTool(this.dataForSEOClient),
      new GoogleHistoricalDomainRankOverviewTool(this.dataForSEOClient),
      new GooglePageIntersectionsTool(this.dataForSEOClient),
      new GoogleBulkTrafficEstimationTool(this.dataForSEOClient),
      new DataForSeoLabsFilterTool(this.dataForSEOClient),
      new GoogleHistoricalKeywordDataTool(this.dataForSEOClient),
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