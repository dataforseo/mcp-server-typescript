import z from "zod";
import { DataForSEOClient } from "../../../../client/dataforseo.client.js";
import { BaseTool } from "../../../base.tool.js";
import { ta } from "zod/v4/locales";

export class AiOptimizationLlmMentionsCrossAggregatedMetricsTool extends BaseTool {

    constructor(dataForSEOClient: DataForSEOClient) {
        super(dataForSEOClient);
    }

    getName(): string {
        return "ai_opt_llm_ment_cross_agg_metrics";
    }

    getDescription(): string {
        return "This endpoint provides aggregated metrics grouped by custom keys for mentions of the keywords or domains specified in the target array of the request";
    }

    getParams(): z.ZodRawShape {
        return {
            targets: z.array(z.object({
                aggregation_key: z.string().describe("Custom"),
                target: z.array(
                    z.union([
                        z.object({
                            domain: z.string().describe("Target domain to search for LLM mentions"),
                            search_filter: z.enum(['include', 'exclude']).optional().describe("Search filter to apply (include or exclude)"),
                            search_scope: z.array(z.enum(['any', 'question', 'answer'])).optional().describe("Target search scope for LLM mentions"),
                        }),
                        z.object({
                            keyword: z.string().describe("Target keyword to search for LLM mentions"),
                            match_type: z.enum(['word_match', 'partial_match']).optional().describe("Match type for the keyword"),
                            search_filter: z.enum(['include', 'exclude']).optional().describe("Search filter to apply (include or exclude)"),
                            search_scope: z.array(z.enum(['any', 'question', 'answer'])).optional().describe("Target search scope for LLM mentions"),
                        })
                    ])
                ).describe("array of objects containing target entities. a single target can contain up to 10 domain and/or keyword entities"),
            })).describe("array of objects containing target entities with aggregation keys. you can specify up to 10, but not less than 2"),
            location_name: z.string().optional().describe(`full name of the location, example: 'United Kingdom', 'United States'`),
            language_code: z.string().optional().describe("Search engine language code (e.g., 'en')"),
            platform: z.enum(['chat_gpt', 'google']).optional().describe("Platform to search for LLM mentions"),
            filters: this.getFilterExpression().optional().describe(
                `you can add several filters at once (8 filters maximum)
   you should set a logical operator and, or between the conditions
   the following operators are supported:
   regex, not_regex, <, <=, >, >=, =, <>, in, not_in, match, not_match, ilike, not_ilike, like, not_like
   you can use the % operator with like and not_like, as well as ilike and not_ilike to match any string of zero or more characters
   merge operator must be a string and connect two other arrays, availible values: or, and.
   example:
["ai_search_volume",">","1000"]
The full list of possible filters is available in 'ai_optimization_llm_mentions_filters' tool`
            ),
            internal_list_limit: z.number().optional().describe("Internal parameter to limit the number of items processed. Not exposed to end-users."),
        };
    }

    async handle(params: any): Promise<any> {
        try {

            let payload: any = {};
            payload['targets'] = params.targets;
            payload['location_name'] = params.location_name;
            payload['language_code'] = params.language_code;
            if (params.platform) {
                payload['platform'] = params.platform;
            }
            if (params.filters) {
                payload['filters'] = params.filters;
            }
            if (params.internal_list_limit) {
                payload['internal_list_limit'] = params.internal_list_limit;
            }

            const response = await this.dataForSEOClient.makeRequest(`/v3/ai_optimization/llm_mentions/cross_aggregated_metrics/live`, 'POST', [payload]);
            return this.validateAndFormatResponse(response);
        } catch (error) {
            return this.formatErrorResponse(error);
        }
    }
}