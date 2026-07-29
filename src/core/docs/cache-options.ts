import { z } from "zod";

export const docsCacheDirSchema = z
  .string()
  .optional()
  .describe(
    "Custom documentation cache directory. Default: %LOCALAPPDATA%\\dataforseo-mcp-server\\docs-cache on Windows (or platform cache dir). Entries expire after 24 hours."
  );
