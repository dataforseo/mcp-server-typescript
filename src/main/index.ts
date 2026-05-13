#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { initializeFieldConfiguration } from '../core/config/field-configuration.js';
import { name, version } from '../core/utils/version.js';
import { initMcpServer } from "./init-mcp-server.js";

// Initialize field configuration if provided
initializeFieldConfiguration();
console.error('Starting DataForSEO MCP Server...');
console.error(`Server name: ${name}, version: ${version}`);

const server = initMcpServer(process.env.DATAFORSEO_USERNAME, process.env.DATAFORSEO_PASSWORD);

// Start the server
async function main() {
  const transport = new StdioServerTransport(); 
  console.error('Starting server');
  await server.connect(transport);
  console.error("DataForSEO MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
