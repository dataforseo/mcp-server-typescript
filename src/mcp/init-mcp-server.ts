import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BaseTool } from "../core/tools/base-tool.js";
import { getPackageName, getPackageVersion } from "../core/version.js";
import { buildToolsRecord } from "./tool-definition.js";

export function initMcpServer(tools: BaseTool<unknown>[]): McpServer {
  const server = new McpServer(
    {
      name: getPackageName(),
      version: getPackageVersion(),
    },
    {
      capabilities: { logging: {} },
      instructions:
        "DataForSEO API tools: browse documentation (docs_index, docs_list_sections, docs_search) and make authenticated API requests (api_request). Prefer OAuth Bearer tokens via HTTP transport (authorization server https://data.dataforseo.com). DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD remain an optional env fallback. Documentation cache directory can be set at server startup with --docs-cache-dir <path> (24h TTL).",
    }
  );

  const toolDefinitions = buildToolsRecord(tools);

  for (const [toolName, tool] of Object.entries(toolDefinitions)) {
    const schema = z.object(tool.params);
    server.registerTool(
      toolName,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: schema.shape,
        annotations: tool.annotations,
      },
      (args) => tool.handler(args)
    );
  }

  return server;
}
