import { BaseTool, DataForSEOFullResponse } from '../../../base.tool.js';
import { DataForSEOClient } from '../../../../client/dataforseo.client.js';
import { ZodRawShape } from 'zod';

export class AiOptimizationLlmMentionsLocationsAndLanguagesListTool extends BaseTool {

    constructor(dataForSEOClient: DataForSEOClient) {
        super(dataForSEOClient);
    }

    protected supportOnlyFullResponse(): boolean {
        return true;
    }

    getName(): string {
        return "ai_optimization_llm_mentions_locations_and_languages";
    }

    getDescription(): string {
        return "Utility tool for ai_llm_mentions to get list of available locations and languages";
    }

    getParams(): ZodRawShape {
        return {};
    }

    async handle(params: any): Promise<any> {
        try {

            const response = await this.dataForSEOClient.makeRequest(`/v3/ai_optimization/llm_mentions/locations_and_languages`, 'GET', null) as any;
            return this.formatResponse(response['items']);
        } catch (error) {
            return this.formatErrorResponse(error);
        }
    }
}