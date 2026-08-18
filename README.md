# DataForSEO MCP Server

> **This is the new v3 MCP server.** The previous v2+ MCP server is **deprecated** and lives at [dataforseo/mcp-server-typescript-deprecated](https://github.com/dataforseo/mcp-server-typescript-deprecated).

MCP server and CLI for LLM agents to browse DataForSEO API documentation and make authenticated API requests. By default the binary starts an MCP server on stdio; CLI commands are an optional second mode.

## Quick Start

Start the MCP server on stdio (default mode; set `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD`):

```bash
npx dataforseo-mcp-server@latest
```

HTTP transport (port 3000; override with `PORT`):

```bash
npx dataforseo-mcp-server@latest --mode http
```

## Authentication

**OAuth 2.0 (default for HTTP MCP):** works out of the box. MCP clients discover the DataForSEO authorization server via Protected Resource metadata and send `Authorization: Bearer` tokens.

**Fallback:** API login/password via environment variables (HTTP Basic). Required for CLI and stdio MCP; on HTTP it is used when no `Authorization` header is present.

```bash
# bash / macOS / Linux
export DATAFORSEO_LOGIN="your_api_login"
export DATAFORSEO_PASSWORD="your_api_password"
```

```powershell
# PowerShell
$env:DATAFORSEO_LOGIN="your_api_login"
$env:DATAFORSEO_PASSWORD="your_api_password"
```

```cmd
REM CMD
set DATAFORSEO_LOGIN=your_api_login
set DATAFORSEO_PASSWORD=your_api_password
```

`DATAFORSEO_USERNAME` is accepted as an alias for `DATAFORSEO_LOGIN`. Get API keys at [https://app.dataforseo.com/api-access](https://app.dataforseo.com/api-access).

## MCP Server

The same tool implementations power both the MCP server and the CLI. One binary serves both modes; MCP is the default.

**How the binary chooses a mode:**

- MCP stdio — default when no CLI command is passed
- MCP HTTP — pass `--mode http` (Streamable HTTP on port 3000; override with `PORT`)
- CLI — when the first command is `docs` or `request`, or when `--cli` / `--help` / `--version` is passed

MCP stdio (default):
```bash
npx dataforseo-mcp-server
```
MCP HTTP:
```bash
npx dataforseo-mcp-server --mode http
```
CLI:
```bash
npx dataforseo-mcp-server docs index
```

**MCP client config** (Cursor, Claude Desktop, and similar clients that use `mcpServers`):

Via URL — use the hosted remote MCP server, or start a local HTTP server (`npx dataforseo-mcp-server --mode http`) and point the client at it. OAuth works out of the box; env credentials are optional fallback only.

Public remote MCP server URL: [https://mcp.dataforseo.com/v3/mcp](https://mcp.dataforseo.com/v3/mcp)

```json
{
  "mcpServers": {
    "dataforseo": {
      "url": "https://mcp.dataforseo.com/v3/mcp"
    }
  }
}
```

Local server (default port 3000):

```json
{
  "mcpServers": {
    "dataforseo": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

Via `command` (stdio) — the client starts the binary itself (stdio is the default mode). OAuth is not used on this transport — set env credentials (or pass them in the MCP client `env` block):

```jsonc
{
  "mcpServers": {
    "dataforseo": {
      "command": "npx",
      "args": [
        "dataforseo-mcp-server",
        // Optional additional args:
        // "--docs-cache-dir", "D:\\my-docs-cache",
        // "--configuration", "field-config.json"
      ],
      "env": {
        "DATAFORSEO_LOGIN": "your_api_login",
        "DATAFORSEO_PASSWORD": "your_api_password",
        // Optional additional env:
        // "FIELD_CONFIG_PATH": "field-config.json"
      }
    }
  }
}
```

From the repo root during development:

```json
{
  "mcpServers": {
    "dataforseo": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/path/to/mcp-server-typescript"
    }
  }
}
```

### MCP Tools

| Tool | Title | Description |
|------|-------|-------------|
| `docs_index` | Docs Index | Fetch documentation index, optionally filtered by section (24h cache) |
| `docs_list_sections` | Docs List Sections | Return available documentation section names |
| `docs_search` | Docs Search | Fetch documentation from a documentation URL (`needCodeExample`, 24h cache) |
| `api_request` | API Request | Make an authenticated API request |

`api_request` uses `.ai` paths by default (no `aiMode` parameter). Request body is passed as `data` (JSON object or array). CLI-only options (`--param`, `--no-ai-mode`) are not exposed via MCP.

### HTTP transport

Streamable HTTP endpoints:

- `POST /mcp`
- `POST /http`

OAuth 2.0 Protected Resource metadata (RFC 9728) is **always** exposed so MCP clients can discover the authorization server and authenticate with Bearer tokens:

- `GET /.well-known/oauth-protected-resource`
- `GET /.well-known/oauth-protected-resource/mcp`
- `GET /.well-known/oauth-protected-resource/http`

Behind a reverse proxy, set `TRUST_PROXY=true` so metadata URLs use `https`.

Auth priority on HTTP requests:

1. `Authorization: Basic` header
2. `Authorization: Bearer` header (OAuth access token)
3. Env credentials (`DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD`) — fallback when no `Authorization` header is sent

## CLI (optional)

In addition to MCP, the same binary exposes `docs` and `request` as CLI commands.

### Commands

| Command | Description |
|---------|-------------|
| `npx dataforseo-mcp-server docs index` | Fetch full API documentation index |
| `npx dataforseo-mcp-server docs index --section "SERP API"` | Filter index by API section |
| `npx dataforseo-mcp-server docs index --list-sections` | List available sections |
| `npx dataforseo-mcp-server docs search <url>` | Fetch documentation from a documentation URL or path (cURL example only by default) |
| `npx dataforseo-mcp-server docs search <url> --need-code-example` | Fetch documentation with PHP, Node.js, Python, and C# examples |
| `npx dataforseo-mcp-server request -X <method> -p <path>` | Make an authenticated API request (`.ai` path by default) |

From a built local clone you can also use `npx .` instead of `npx dataforseo-mcp-server`.

### Examples

```bash
# Browse SERP API endpoints
npx dataforseo-mcp-server docs index --section "SERP API"

# Read endpoint documentation (path or full docs URL)
npx dataforseo-mcp-server docs search serp/google/organic/live/regular
npx dataforseo-mcp-server docs search https://docs.dataforseo.com/v3/serp/google/organic/live/regular

# Include multi-language code examples (PHP, Node.js, Python, C#)
npx dataforseo-mcp-server docs search backlinks/referring_networks/live --need-code-example

# Live SERP request (recommended: use --param)
npx dataforseo-mcp-server request -X POST -p /v3/serp/google/organic/live/regular \
  --param keyword=dataforseo --param language_code=en --param location_code=2840

# Same request via JSON body
npx dataforseo-mcp-server request -X POST -p /v3/serp/google/organic/live/regular \
  -d '[{"keyword":"dataforseo","location_code":2840,"language_code":"en"}]'
```

Documentation responses are cached for **24 hours**. Default cache directory:

- **Windows:** `%LOCALAPPDATA%\dataforseo-mcp-server\docs-cache`
- **macOS:** `~/Library/Caches/dataforseo-mcp-server/docs-cache`
- **Linux:** `~/.cache/dataforseo-mcp-server/docs-cache` (or `$XDG_CACHE_HOME`)

Override with `--cache-dir <path>` on CLI `docs` commands. For MCP, pass `--docs-cache-dir <path>` in server startup `args`.

API responses are returned as the response body only (parsed JSON when possible). When a field configuration is loaded, `api_request` / `request` responses are trimmed to the configured fields for that endpoint path (see [Field configuration](#field-configuration)).

## Field configuration

Optionally limit which fields are returned from API responses. Unlike the previous multi-tool MCP server (keys = tool names), this package keys the config by **API endpoint path**.

```bash
# MCP stdio (default when no CLI command is passed)
npx dataforseo-mcp-server --configuration field-config.json

# MCP HTTP
npx dataforseo-mcp-server --mode http --configuration field-config.json

# CLI
npx dataforseo-mcp-server --configuration field-config.json request -X POST -p /v3/backlinks/summary/live --param target=example.com
```

Or set env:

- `FIELD_CONFIG_PATH` — path to a JSON file (Node)
- `FIELD_CONFIG_JSON` — inline JSON string (Node / Cloudflare Worker)

Minimal example (see `field-config.example.json` for a fuller sample):

```json
{
  "supported_fields": {
    "/v3/serp/google/organic/live/advanced": ["id", "items.title", "items.url", "status_code"],
    "/v3/backlinks/summary/live": ["id", "items.backlinks", "items.referring_domains", "status_code"]
  }
}
```

Behavior:

- Built-in defaults always apply for `/v3/on_page/lighthouse/live/json` (shrunk Lighthouse payload). Custom config merges on top and can override any path.
- Path match ignores `.ai` suffix, trailing slash, and host (full URLs work).
- If the path is configured with a non-empty field list → only those fields are kept (applied to each `tasks[].result[]` item).
- If the path has an empty field list `[]` → full response for that path (disables filtering).
- If the path is missing from both defaults and custom config → full response.

Copy the example and trim to the endpoints you use:

```bash
cp field-config.example.json my-config.json
```

## Architecture

```
src/
├── index.ts            # Unified entry (MCP by default stdio; CLI if docs/request/--cli)
├── config/             # URLs, sections, auth server
├── core/
│   ├── api/            # auth, client, path, request-body
│   ├── cli/            # program, error, output
│   ├── config/         # field configuration + defaults
│   ├── docs/           # path, section, cache
│   ├── http/           # fetch
│   ├── mcp/            # startup args (--configuration, --docs-cache-dir)
│   ├── tools/          # shared CLI + MCP tool implementations
│   ├── utils/          # field filter
│   ├── env.ts
│   └── version.ts
├── mcp/
│   ├── init-mcp-server.ts
│   ├── tool-definition.ts
│   ├── auth-middleware.ts
│   ├── http-routes.ts
│   ├── index.ts        # stdio transport
│   └── index-http.ts   # streamable HTTP
└── worker/             # Cloudflare Worker entry (built separately)
```

### Build outputs

| Target | Command | Output | Used by |
|--------|---------|--------|---------|
| Node (MCP + CLI) | `npm run build` (`tsc`) | `dist/index.js` | `bin`, Docker, `start*` scripts |
| Cloudflare Worker | `npm run worker:build` | `build/worker/worker/index-worker.js` | `wrangler.jsonc` → `main` |

Worker path is `build/worker/worker/...` because `tsconfig.worker.json` sets `rootDir` to `src` and the entry lives at `src/worker/index-worker.ts`.

## For LLM Agents

Read [SKILL.md](./SKILL.md) in this repo for full agent instructions.

## Development

Requires Node.js 20+.

```bash
npm install
npm run build

# Dev (tsx, no build step)
npm run dev              # MCP stdio (default)
npm run dev:mcp:http     # MCP HTTP
npm run dev -- docs index --section "SERP API"   # CLI

# After build
npm run start            # MCP stdio (default)
npm run start:mcp:http   # Streamable HTTP
npx . docs index --list-sections
```
