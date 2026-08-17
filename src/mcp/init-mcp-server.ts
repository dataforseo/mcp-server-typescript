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
