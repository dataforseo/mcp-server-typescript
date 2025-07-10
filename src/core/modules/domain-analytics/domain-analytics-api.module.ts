import { BaseModule, ToolDefinition } from '../base.module.js';
import { DomainTechnologiesTool } from './tools/technologies/domain-technologies.tool.js';
import { DomainTechnologiesFiltersTool } from './tools/technologies/domain-technologies-filters.tool.js';
import { WhoisFiltersTool } from './tools/whois/whois-filters.tool.js';
import { WhoisOverviewTool } from './tools/whois/whois-overview.tool.js';

export class DomainAnalyticsApiModule extends BaseModule {
  getTools(): Record<string, ToolDefinition> {
    const tools = [
      new WhoisOverviewTool(this.dataForSEOClient),
      new WhoisFiltersTool(this.dataForSEOClient),
      new DomainTechnologiesTool(this.dataForSEOClient),
      new DomainTechnologiesFiltersTool(this.dataForSEOClient),
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