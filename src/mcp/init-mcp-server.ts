import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BaseTool } from "../core/tools/base-tool.js";
import { getPackageName, getPackageVersion } from "../core/version.js";
import { McpServerInstructions } from "./instructions.js";
import { buildToolsRecord } from "./tool-definition.js";

export function initMcpServer(tools: BaseTool<unknown>[]): McpServer {
  const server = new McpServer(
    {
      name: getPackageName(),
      version: getPackageVersion(),
    },
    {
      capabilities: { logging: {} },
      instructions: McpServerInstructions.TEXT,
      // Counts array elements and object members across the whole tools/call
      // arguments object before any tool schema is walked. The heaviest request
      // this server forwards is a bulk POST of 100 tasks (the DataForSEO API
      // limit), a few thousand elements at most; 10,000 leaves several times
      // that headroom while staying far below the element count a 100 KB JSON
      // body can pack (2-byte elements alone reach ~51,000 in 100 KB).
      maxToolInputElements: 10_000,
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
      (args, extra) => tool.handler(args, extra)
    );
  }

  return server;
}
