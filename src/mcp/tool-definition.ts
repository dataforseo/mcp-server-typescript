import type { ToolAnnotations, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  clientUserAgentFromExtra,
  runWithClientUserAgent,
} from "../core/api/user-agent.js";
import type { BaseTool } from "../core/tools/base-tool.js";
import type { ToolResult } from "../core/tools/types.js";

export interface ToolDefinition {
  title: string;
  description: string;
  params: z.ZodRawShape;
  handler: (params: unknown, extra?: unknown) => Promise<CallToolResult>;
  annotations: ToolAnnotations;
}

export function toMcpResponse(result: ToolResult): CallToolResult {
  return {
    content: result.content,
    ...(result.isError ? { isError: true } : {}),
  };
}

export function buildToolDefinition(tool: BaseTool<unknown>): ToolDefinition {
  if (!(tool.schema instanceof z.ZodObject)) {
    throw new Error(
      `Tool "${tool.name}" must use a ZodObject schema for MCP registration`
    );
  }

  return {
    title: tool.title,
    description: tool.description,
    params: tool.schema.shape,
    annotations: tool.getAnnotations(),
    handler: (params, extra) =>
      runWithClientUserAgent(clientUserAgentFromExtra(extra), async () =>
        toMcpResponse(await tool.invoke(params))
      ),
  };
}

export function buildToolsRecord(
  tools: BaseTool<unknown>[]
): Record<string, ToolDefinition> {
  return tools.reduce<Record<string, ToolDefinition>>((acc, tool) => {
    acc[tool.name] = buildToolDefinition(tool);
    return acc;
  }, {});
}
