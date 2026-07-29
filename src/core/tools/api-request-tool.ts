import type { Command } from "commander";
import { z } from "zod";
import { applyFieldConfigurationToResponse } from "../config/field-configuration.js";
import { applyAiModePath } from "../api/path.js";
import { makeApiRequest } from "../api/client.js";
import { buildRequestBody, collectParam } from "../api/request-body.js";
import { printError } from "../cli/error.js";
import { printToolResult } from "../cli/output.js";
import { DEFAULT_API_TOOL_ANNOTATIONS } from "./tool-annotations.js";
import { BaseTool } from "./base-tool.js";
import { bodyResult, errorResult } from "./types.js";

export const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export const apiRequestMcpInputSchema = z.object({
  method: z.enum(HTTP_METHODS).describe("HTTP method"),
  path: z
    .string()
    .optional()
    .describe("API path (e.g. /v3/serp/google/organic/live/regular)"),
  url: z.string().optional().describe("Full API URL (alternative to path)"),
  data: z
    .any()
    .optional()
    .describe("Request body as JSON object or array of task objects"),
});

export const apiRequestCliInputSchema = apiRequestMcpInputSchema.extend({
  params: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("Request body fields merged into the first task object"),
  aiMode: z
    .boolean()
    .optional()
    .default(true)
    .describe("Use .ai path suffix (default: true)"),
});

export type ApiRequestMcpInput = z.infer<typeof apiRequestMcpInputSchema>;
export type ApiRequestCliInput = z.infer<typeof apiRequestCliInputSchema>;

export class ApiRequestTool extends BaseTool<ApiRequestMcpInput> {
  constructor(private readonly authHeader?: string) {
    super();
  }

  readonly name = "api_request";
  readonly title = "API Request";
  readonly description =
    "Make an authenticated request to the DataForSEO API";
  readonly schema = apiRequestMcpInputSchema;

  getAnnotations() {
    return DEFAULT_API_TOOL_ANNOTATIONS;
  }

  protected async execute(input: ApiRequestMcpInput) {
    return this.performRequest(input, { aiMode: true, params: {} });
  }

  async invokeCli(args: unknown) {
    try {
      const input = apiRequestCliInputSchema.parse(args);
      return await this.performRequest(input, {
        aiMode: input.aiMode ?? true,
        params: input.params ?? {},
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
        return errorResult(`Invalid input: ${details}`);
      }

      const message = error instanceof Error ? error.message : String(error);
      return errorResult(message);
    }
  }

  registerCli(program: Command): void {
    program
      .command("request")
      .description("Make an authenticated request to the DataForSEO API")
      .addHelpText(
        "after",
        `
See SKILL.md in the project root for full LLM agent guide. Run commands with: npx dataforseo-mcp-server
`
      )
      .requiredOption(
        "-X, --method <method>",
        "HTTP method (GET, POST, PUT, DELETE)"
      )
      .option(
        "-p, --path <path>",
        "API path (e.g. /v3/serp/google/organic/live/regular)"
      )
      .option("-u, --url <url>", "Full API URL (alternative to --path)")
      .option(
        "--param <key=value>",
        "Request field as key=value (repeatable; same key builds an array; use [item] or [a|b] for arrays in shells that strip quotes)",
        collectParam,
        {} as Record<string, unknown>
      )
      .option(
        "-d, --data <json>",
        "Request body as JSON string (merged with --param; --param values override JSON)"
      )
      .option("--no-ai-mode", "Use standard API path without .ai suffix")
      .action(
        async (options: {
          method: HttpMethod;
          path?: string;
          url?: string;
          param?: Record<string, unknown>;
          data?: string;
          noAiMode?: boolean;
        }) => {
          try {
            const result = await this.invokeCli({
              method: options.method,
              path: options.path,
              url: options.url,
              params: options.param,
              data: options.data,
              aiMode: !options.noAiMode,
            });
            printToolResult(result);
          } catch (error) {
            printError(error);
          }
        }
      );
  }

  private async performRequest(
    input: ApiRequestMcpInput,
    options: { aiMode: boolean; params: Record<string, unknown> }
  ) {
    const target = input.url ?? input.path;
    if (!target) {
      throw new Error("Either path or url is required.");
    }

    const requestPath = applyAiModePath(target, options.aiMode);
    const body = buildRequestBody(input.data, options.params);

    const response = await makeApiRequest({
      method: input.method,
      path: requestPath,
      body,
      ...(this.authHeader ? { authHeader: this.authHeader } : {}),
    });

    let parsedBody: unknown = response.body;
    try {
      parsedBody = JSON.parse(response.body);
    } catch {
      // keep as string
    }

    if (typeof parsedBody !== "string") {
      parsedBody = applyFieldConfigurationToResponse(parsedBody, requestPath);
    }

    return bodyResult(parsedBody, response.status >= 400);
  }
}
