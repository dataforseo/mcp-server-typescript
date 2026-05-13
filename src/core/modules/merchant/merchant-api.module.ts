import { BaseModule, ToolDefinition } from '../base.module.js';
import { PromptDefinition } from '../prompt-definition.js';
import { MerchantAmazonAsinLiveAdvancedTool } from './tools/amazon/amazon-asin-live-advanced.tool.js';
import { MerchantAmazonSellersLiveAdvancedTool } from './tools/amazon/amazon-sellers-live-advanced.tool.js';
import { MerchantAmazonProductsLiveAdvancedTool } from './tools/amazon/amazon-products-live-advanced.tool.js';
import { MerchantAmazonLocationsListTool } from './tools/amazon/amazon-locations-list.tool.js';

export class MerchantApiModule extends BaseModule {
  getTools(): Record<string, ToolDefinition> {
    const tools = [
      new MerchantAmazonAsinLiveAdvancedTool(this.dataForSEOClient),
      new MerchantAmazonSellersLiveAdvancedTool(this.dataForSEOClient),
      new MerchantAmazonProductsLiveAdvancedTool(this.dataForSEOClient),
      new MerchantAmazonLocationsListTool(this.dataForSEOClient),
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

  getPrompts(): Record<string, PromptDefinition> {
    return {};
  }
}
