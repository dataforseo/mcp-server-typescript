import { ApiRequestTool } from "./api-request-tool.js";
import { DocsIndexTool } from "./docs-index-tool.js";
import { DocsListSectionsTool } from "./docs-list-sections-tool.js";
import { DocsSearchTool } from "./docs-search-tool.js";
import type { BaseTool } from "./base-tool.js";

export { BaseTool } from "./base-tool.js";
export type { ToolResult, ToolTextContent } from "./types.js";
export {
  DocsIndexTool,
  docsIndexMcpInputSchema,
  docsIndexCliInputSchema,
} from "./docs-index-tool.js";
export type {
  DocsIndexMcpInput,
  DocsIndexCliInput,
} from "./docs-index-tool.js";
export {
  DocsListSectionsTool,
  docsListSectionsInputSchema,
} from "./docs-list-sections-tool.js";
export type { DocsListSectionsInput } from "./docs-list-sections-tool.js";
export {
  DocsSearchTool,
  docsSearchMcpInputSchema,
  docsSearchCliInputSchema,
} from "./docs-search-tool.js";
export type {
  DocsSearchMcpInput,
  DocsSearchCliInput,
} from "./docs-search-tool.js";
export {
  ApiRequestTool,
  apiRequestMcpInputSchema,
  apiRequestCliInputSchema,
  HTTP_METHODS,
} from "./api-request-tool.js";
export type {
  ApiRequestMcpInput,
  ApiRequestCliInput,
  HttpMethod,
} from "./api-request-tool.js";

export const docsIndexTool = new DocsIndexTool();
export const docsListSectionsTool = new DocsListSectionsTool();
export const docsSearchTool = new DocsSearchTool();
export const apiRequestTool = new ApiRequestTool();

export const ALL_TOOLS: BaseTool<unknown>[] = [
  docsIndexTool,
  docsListSectionsTool,
  docsSearchTool,
  apiRequestTool,
];

export function getTools(authHeader?: string): BaseTool<unknown>[] {
  if (authHeader === undefined) {
    return ALL_TOOLS;
  }

  return [
    docsIndexTool,
    docsListSectionsTool,
    docsSearchTool,
    new ApiRequestTool(authHeader),
  ];
}

export function registerCliCommands(
  program: import("commander").Command
): void {
  const docs = program.command("docs").description("Documentation commands");

  docsIndexTool.registerCli?.(docs);
  docsSearchTool.registerCli?.(docs);
  apiRequestTool.registerCli?.(program);
}
