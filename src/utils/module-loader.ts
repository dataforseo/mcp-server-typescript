import { DataForSEOClient } from '../client/dataforseo.client.js';
import { SerpApiModule } from '../modules/serp/serp-api.module.js';
import { KeywordsDataApiModule } from '../modules/keywords-data/keywords-data-api.module.js';
import { OnPageApiModule } from '../modules/onpage/onpage-api.module.js';
import { DataForSEOLabsApi } from '../modules/dataforseo-labs/dataforseo-labs-api.module.js';
import { BacklinksApiModule } from '../modules/backlinks/backlinks-api.module.js';
import { BusinessDataApiModule } from '../modules/business-data-api/business-data-api.module.js';
import { DomainAnalyticsApiModule } from '../modules/domain-analytics/domain-analytics-api.module.js';
import { BaseModule } from '../modules/base.module.js';
import { EnabledModules, isModuleEnabled } from '../config/modules.config.js';
import { ContentAnalysisApiModule } from '../modules/content-analysis/content-analysis-api.module.js';

export class ModuleLoaderService {
  static loadModules(dataForSEOClient: DataForSEOClient, enabledModules: EnabledModules): BaseModule[] {
    const modules: BaseModule[] = [];

    if (isModuleEnabled('SERP', enabledModules)) {
      modules.push(new SerpApiModule(dataForSEOClient));
    }
    if (isModuleEnabled('KEYWORDS_DATA', enabledModules)) {
      modules.push(new KeywordsDataApiModule(dataForSEOClient));
    }
    if (isModuleEnabled('ONPAGE', enabledModules)) {
      modules.push(new OnPageApiModule(dataForSEOClient));
    }
    if (isModuleEnabled('DATAFORSEO_LABS', enabledModules)) {
      modules.push(new DataForSEOLabsApi(dataForSEOClient));
    }
    if (isModuleEnabled('BACKLINKS', enabledModules)) {
      modules.push(new BacklinksApiModule(dataForSEOClient));
    }
    if (isModuleEnabled('BUSINESS_DATA', enabledModules)) {
      modules.push(new BusinessDataApiModule(dataForSEOClient));
    }
    if (isModuleEnabled('DOMAIN_ANALYTICS', enabledModules)) {
      modules.push(new DomainAnalyticsApiModule(dataForSEOClient));
    }
    if(isModuleEnabled('CONTENT_ANALYSIS', enabledModules)) {
      modules.push(new ContentAnalysisApiModule(dataForSEOClient));
    }

    return modules;
  }
}