import { BaseTool, DataForSEOFullResponse } from '../../../base.tool.js';
import { DataForSEOClient } from '../../../../client/dataforseo.client.js';
import { ZodRawShape } from 'zod';

export class AiOptimizationKeywordDataLocationsAndLanguagesListTool extends BaseTool {

  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  protected supportOnlyFullResponse(): boolean {
    return true;
  }
  
  getName(): string {
      return "ai_opt_kw_data_loc_and_lang";
  }

  getDescription(): string {
      return "Utility tool for 'AI Optimization Keyword Data Locations and Languages' (ai_opt_kw_data_loc_and_lang) to get list of availible locations and languages";
  }

  getParams(): ZodRawShape {
     return {};
  }

  async handle(params: any): Promise<any> {
     try {

      const response = await this.dataForSEOClient.makeRequest(`/v3/ai_optimization/ai_keyword_data/locations_and_languages`, 'GET', null);
      return this.formatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

}