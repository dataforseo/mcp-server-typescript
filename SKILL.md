---
name: dataforseo-mcp-server
description: >-
  Run DataForSEO API tasks via the CLI in a shell (docs index, docs search, request).
  Use when the agent should execute terminal commands with npx dataforseo-mcp-server.
---

# DataForSEO MCP Server — LLM Agent Guide

Run shell commands and read stdout/stderr. Always invoke the tool through the terminal — never substitute another integration path.

## How AI agents interact with this tool

1. **Invoke via shell** — use the terminal (Shell tool) to run `npx dataforseo-mcp-server …` commands.
2. **Read the output** — successful results are printed to stdout (JSON or documentation text). Errors go to stderr and exit code is non-zero.
3. **Auth for CLI** — set `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` in the shell environment (fallback / CLI path; see Authentication below).

**Binary name:** `npx dataforseo-mcp-server` (or `npx .` from this repo root after `npm install` + `npm run build`).

**Working directory:** any directory where credentials are available in the environment (for CLI).

---



## Authentication


| Mode | Preferred auth | Fallback |
| ---- | -------------- | -------- |
| MCP stdio (default when no CLI command; or `npx dataforseo-mcp-server` with no args) | Env credentials (HTTP Basic) | — |
| HTTP MCP (`--mode http`) | OAuth 2.0 Bearer via authorization server `https://data.dataforseo.com` (discovery at `/.well-known/oauth-protected-resource`) | `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` in env |
| CLI (`docs` / `request` / `--cli`) | Env credentials (HTTP Basic) | — |


Override the authorization server with `AUTH_SERVER_URL` if needed.

---



## Quick reference


| Task                               | Shell command                                                               |
| ---------------------------------- | --------------------------------------------------------------------------- |
| Docs index                         | `npx dataforseo-mcp-server docs index [--section "SERP API"]`               |
| List sections                      | `npx dataforseo-mcp-server docs index --list-sections`                      |
| Endpoint docs                      | `npx dataforseo-mcp-server docs search <url-or-path>`                       |
| Endpoint docs (with code examples) | `npx dataforseo-mcp-server docs search <url-or-path> --need-code-example`   |
| GET request                        | `npx dataforseo-mcp-server request -X GET -p /v3/...`                       |
| POST request                       | `npx dataforseo-mcp-server request -X POST -p <path> --param key=value ...` |
| POST request (JSON)                | `npx dataforseo-mcp-server request -X POST -p <path> -d '<json-array>'`     |


By default, API paths use the `.ai` suffix (e.g. `/v3/serp/google/organic/live/regular.ai`). Pass `--no-ai-mode` to use the standard path.

**CLI credentials (fallback / shell):** set `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` as environment variables. Get keys at [https://app.dataforseo.com/api-access](https://app.dataforseo.com/api-access)

```bash
export DATAFORSEO_LOGIN=your_api_login
export DATAFORSEO_PASSWORD=your_api_password
```

Windows PowerShell: `$env:DATAFORSEO_LOGIN="..."` / `$env:DATAFORSEO_PASSWORD="..."`. CMD: `set DATAFORSEO_LOGIN=...`

`DATAFORSEO_USERNAME` is also accepted as an alias for `DATAFORSEO_LOGIN`. For HTTP MCP, prefer OAuth; env credentials are only a fallback when no `Authorization` header is present.

---



## Agent workflow (shell)

Run these steps as separate shell commands:

1. `npx dataforseo-mcp-server docs index --section "<API>"` — find endpoint path.
2. `npx dataforseo-mcp-server docs search <path>` — read method, parameters, example body.
3. `npx dataforseo-mcp-server request -X <METHOD> -p <path> --param key=value ...` (or `-d '<json-array>'`) — call API.

Parse the printed output to decide the next step.

---



## POST body

POST endpoints accept a **JSON array of task objects**: `[{ ... }]`.

**Preferred:** pass fields with repeatable `--param key=value` (merged into the first task object). Use exact API field names from endpoint docs (e.g. `keyword`, `language_code`, `location_code`).

`--param` values override the same fields in `-d` JSON when both are used.

**Array values** (PowerShell strips `"` inside `[...]`, so prefer these forms):

```bash
# single-item array
--param keywords=[phone]

# multiple items (pipe-separated)
--param keywords=[phone|tablet|laptop]

# or repeat the same key
--param keywords=phone --param keywords=tablet

# order_by with comma inside the value
--param order_by=[keyword_info.search_volume,desc]
```

Valid JSON in `--param` still works when your shell preserves quotes (bash: `'keywords=["phone"]'`).

### Example: Live SERP (`/v3/serp/google/organic/live/regular`)

```bash
npx dataforseo-mcp-server request -X POST -p /v3/serp/google/organic/live/regular \
  --param keyword=dataforseo --param language_code=en --param location_code=2840
```

JSON form:

```bash
npx dataforseo-mcp-server request -X POST -p /v3/serp/google/organic/live/regular -d '[{\"keyword\":\"dataforseo\",\"location_code\":2840,\"language_code\":\"en\"}]'
```

---



## Installation (once per environment)

```bash
cd /path/to/mcp-server-typescript
npm install
npm run build
export DATAFORSEO_LOGIN=your_api_login
export DATAFORSEO_PASSWORD=your_api_password
npx dataforseo-mcp-server --help
```

From a project with CLI as a dependency:

```bash
cd /path/to/your-project
npm install
export DATAFORSEO_LOGIN=your_api_login
export DATAFORSEO_PASSWORD=your_api_password
npx dataforseo-mcp-server docs index --list-sections
```

Dev without build (CLI repo only): `npm run dev -- docs index`

---



## Commands reference



### docs index

```bash
npx dataforseo-mcp-server docs index
npx dataforseo-mcp-server docs index --section "SERP API"
npx dataforseo-mcp-server docs index --list-sections
npx dataforseo-mcp-server docs index --cache-dir D:\my-docs-cache
```

Sections: SERP API, AI Optimization API, Keywords Data API, Domain Analytics API, DataForSEO Labs API, OnPage API, Backlinks API, Content Analysis API, Merchant API, App Data API, Business Data API, Databases, Appendix.

### docs search

```bash
npx dataforseo-mcp-server docs search serp/google/organic/live/regular
npx dataforseo-mcp-server docs search https://docs.dataforseo.com/v3/on_page/instant_pages
npx dataforseo-mcp-server docs search backlinks/referring_networks/live --need-code-example
npx dataforseo-mcp-server docs search serp/google/organic/live/regular --cache-dir D:\my-docs-cache
```

Accepts a documentation URL or a path relative to `https://docs.dataforseo.com/v3/`. The `.md` suffix is optional. Pass `--need-code-example` to include full code examples.

### Documentation cache

`docs index` and `docs search` cache fetched documentation for **24 hours**.


| Override          | Example                                           |
| ----------------- | ------------------------------------------------- |
| Default (Windows) | `%LOCALAPPDATA%\dataforseo-mcp-server\docs-cache` |
| CLI flag          | `--cache-dir D:\my-cache`                         |
| MCP startup arg   | `--docs-cache-dir D:\my-cache` in server `args`   |


If not overridden, the platform default directory is used.

### request


| Option                | Description                                                |
| --------------------- | ---------------------------------------------------------- |
| `-X, --method`        | GET, POST, PUT, DELETE (required)                          |
| `-p, --path`          | `/v3/serp/google/organic/live/regular`                     |
| `-u, --url`           | Full URL (alternative to `-p`)                             |
| `-d, --data`          | JSON body (POST/PUT)                                       |
| `--param <key=value>` | Request field (repeatable; merged into first task)         |
| `--no-ai-mode`        | Use standard API path without `.ai` (default: `.ai` is on) |


Response output is the API response body (parsed JSON when possible). Optional field filtering via `--configuration field-config.json` / `FIELD_CONFIG_PATH` (keys = endpoint paths; see `field-config.example.json`).

---

## DataForSEO API basics

- **API base:** `https://api.dataforseo.com`
- **Docs base:** `https://docs.dataforseo.com/v3`
- **Auth:** OAuth Bearer preferred on HTTP MCP; HTTP Basic via `DATAFORSEO_LOGIN`/`DATAFORSEO_PASSWORD` as fallback (and for CLI/stdio)
- **POST body:** JSON from endpoint documentation
- **Response:** `status_code` `20000` = OK; each task has `id`, `status_code`, `result`
- **Standard vs Live:** Standard = POST task then GET by id; Live = one POST returns results
- **Errors:** `npx dataforseo-mcp-server docs search appendix/errors`


| Product              | Use case                            |
| -------------------- | ----------------------------------- |
| SERP API             | Search results (Google, Bing, etc.) |
| Keywords Data API    | Search volume, suggestions          |
| DataForSEO Labs API  | Keyword research, competitors       |
| Backlinks API        | Backlink profiles                   |
| OnPage API           | Site crawl, audit, instant pages    |
| Domain Analytics API | Domain metrics, WHOIS               |
| Content Analysis API | Brand mentions                      |
| Merchant API         | Google Shopping data                |
| Business Data API    | GBP, reviews                        |
| App Data API         | App Store / Play Store              |
| AI Optimization API  | LLM mention tracking                |
