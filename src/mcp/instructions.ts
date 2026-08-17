/**
 * Server-level instructions returned to MCP clients during initialize.
 */
export class McpServerInstructions {
  static readonly TEXT =
  `DataForSEO API tools: browse documentation (docs_index, docs_list_sections, docs_search) and make authenticated API requests (api_request). 
   Prefer OAuth Bearer tokens via HTTP transport (authorization server https://data.dataforseo.com). 
   DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD remain an optional env fallback. 
   Documentation cache directory can be set at server startup with --docs-cache-dir <path> (24h TTL).`;
}