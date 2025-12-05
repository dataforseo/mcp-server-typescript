import { z } from 'zod';
import { DataForSEOClient } from '../../../../../client/dataforseo.client.js';
import { BaseTool } from '../../../../base.tool.js';

export class AiOptimizationChatGptLocationsTool extends BaseTool {

    constructor(dataForSEOClient: DataForSEOClient) {
        super(dataForSEOClient);
    }

    protected supportOnlyFullResponse(): boolean {
        return true;
    }

    getName(): string {
        return "ai_optimization_chat_gpt_scraper_locations";
    }

    getDescription(): string {
        return "Utility tool for ai_optimization_chat_gpt_scraper to get list of available locations";
    }

    getParams(): z.ZodRawShape {
        return {
            country_iso_code: z.string().optional().describe("ISO 3166-1 alpha-2 country code, for example: US, GB, MT"),
            location_name: z.string().optional().describe("Name of location or it`s part.")
        };
    }

    async handle(params: any): Promise<any> {
        try {

            let payload: Record<string, unknown> = {};
            if (params.country_iso_code) {
                payload['country_iso_code'] = params.country_iso_code;
            }
            if (params.location_name) {
                payload['location_name'] = params.location_name;
            }

            let method = payload && Object.keys(payload).length > 0 ? 'POST' : 'GET';
            const response = await this.dataForSEOClient.makeRequest(`/v3/ai_optimization/chat_gpt/llm_scraper/locations`, method, method === 'POST' ? [payload] : null) as any;
            return this.formatResponse(response['items']);
        } catch (error) {
            return this.formatErrorResponse(error);
        }
    }
}