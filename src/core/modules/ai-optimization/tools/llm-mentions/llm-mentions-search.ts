import z from "zod";
import { DataForSEOClient } from "../../../../client/dataforseo.client.js";
import { BaseTool } from "../../../base.tool.js";

export class AiOptimizationLlmMentionsSearchTool extends BaseTool {

    constructor(dataForSEOClient: DataForSEOClient) {
        super(dataForSEOClient);
    }

    getName(): string {
        return "ai_opt_llm_ment_search";
    }

    getDescription(): string {
        return "This endpoint provides aggregated LLM mentions metrics grouped by the most frequently mentioned pages for the specified target";
    }

    getParams(): z.ZodRawShape {
        return {
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
            ).describe("Array of target objects to search for LLM mentions. Each object must contain either 'domain' or 'keyword'. Maximum number of targets: 1000"),
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
            order_by: z.array(z.string()).optional().describe(
                `resuresults sorting rules
optional field
you can use the same values as in the filters array to sort the results
possible sorting types:
asc – results will be sorted in the ascending order
desc – results will be sorted in the descending order
you should use a comma to set up a sorting type
example:
["ai_search_volume,desc"]
note that you can set no more than three sorting rules in a single request
you should use a comma to separate several sorting rules
example:
["ai_search_volume,desc"]
The full list of possible orders is available in 'ai_optimization_llm_mentions_filters' tool`
            ),
            limit: z.number().optional().describe("Number of results to return. Default is 10, maximum is 1000."),
        };
    }

    async handle(params: any): Promise<any> {
        try {

            let payload: any = {};
            payload['target'] = params.target;
            payload['location_name'] = params.location_name;
            payload['language_code'] = params.language_code;
            if (params.platform) {
                payload['platform'] = params.platform;
            }
            if (params.filters) {
                payload['filters'] = params.filters;
            }
            if (params.order_by) {
                payload['order_by'] = params.order_by;
            }
            if (params.limit) {
                payload['limit'] = params.limit;
            }

            const response = await this.dataForSEOClient.makeRequest(`/v3/ai_optimization/llm_mentions/search/live`, 'POST', [payload]);
            return this.validateAndFormatResponse(response);
        } catch (error) {
            return this.formatErrorResponse(error);
        }
    }
}