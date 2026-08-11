import { Command } from "commander";
import { getPackageVersion } from "../version.js";
import { registerCliCommands } from "../tools/index.js";

const program = new Command();

program
  .name("dataforseo-mcp-server")
  .description(
    "CLI and MCP server for DataForSEO API — browse documentation and make API requests"
  )
  .version(getPackageVersion());

registerCliCommands(program);

program.parse();
