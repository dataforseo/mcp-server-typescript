import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getTools } from "../core/tools/index.js";
import { getPackageName, getPackageVersion } from "../core/version.js";
import { initMcpServer } from "./init-mcp-server.js";

console.error("Starting DataForSEO MCP Server...");
console.error(
  `Server name: ${getPackageName()}, version: ${getPackageVersion()}`
);

const server = initMcpServer(getTools());
const transport = new StdioServerTransport();

await server.connect(transport);
console.error("DataForSEO MCP Server running on stdio");
