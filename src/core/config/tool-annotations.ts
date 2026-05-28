import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

export const DEFAULT_DATAFORSEO_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};
