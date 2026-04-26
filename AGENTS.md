# Agent Instructions — DataForSEO MCP Server

## Project Overview

TypeScript **Model Context Protocol (MCP) server** that wraps DataForSEO APIs as MCP tools and prompts.
AI assistants (Claude, ChatGPT, Copilot) use this to fetch live SEO data via a standardized interface.

Transports supported: **stdio** (default) · **HTTP** · **SSE** · **Cloudflare Worker**

---

## Build & Run

```bash
npm install          # install deps
npm run build        # compile → build/main/
npm start            # stdio transport
npm run http         # HTTP transport (port 3000)
npm run sse          # SSE transport
npm run validate     # build + check all tool names
npm run dev          # watch mode
```

**Worker (Cloudflare):**
```bash
npm run worker:build   # compile worker
npm run worker:dev     # local wrangler dev
npm run worker:deploy  # deploy to Cloudflare
```

**Docker:**
```bash
docker build -t dataforseo-mcp .
docker run -e DATAFORSEO_USERNAME=x -e DATAFORSEO_PASSWORD=x dataforseo-mcp
```

---

## Environment Variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DATAFORSEO_USERNAME` | ✅ | — | API login |
| `DATAFORSEO_PASSWORD` | ✅ | — | API password |
| `ENABLED_MODULES` | ❌ | all | Comma-separated module names |
| `ENABLED_PROMPTS` | ❌ | all | Comma-separated prompt names |
| `DATAFORSEO_FULL_RESPONSE` | ❌ | `false` | `true` = raw API response |
| `DATAFORSEO_SIMPLE_FILTER` | ❌ | `false` | `true` = flat filter schema (required for ChatGPT) |

**Available module names:**
`AI_OPTIMIZATION` `SERP` `KEYWORDS_DATA` `ONPAGE` `DATAFORSEO_LABS` `BACKLINKS` `BUSINESS_DATA` `DOMAIN_ANALYTICS` `CONTENT_ANALYSIS`

---

## Repository Structure

```
src/
  core/
    client/           # DataForSEO HTTP client (makeRequest)
    config/           # Global config, field filtering, module registry
    modules/          # One folder per API module
      base.module.ts  # Abstract module: getTools() + getPrompts()
      base.tool.ts    # Abstract tool: getName/getDescription/getParams/handle
      prompt-definition.ts
      serp/           # Example module
        serp-api.module.ts
        serp.prompt.ts
        tools/
          serp-organic-live-advanced.tool.ts
    utils/            # Field filter, module loader, version
  main/
    index.ts          # stdio entry
    index-http.ts     # HTTP entry
    index-sse-http.ts # SSE entry
    init-mcp-server.ts  # Wires everything into McpServer
  worker/             # Cloudflare Worker entry
```

---

## Architecture

### Adding a Tool

1. Create `src/core/modules/<module>/tools/<name>.tool.ts` extending `BaseTool`
2. Implement: `getName()` · `getDescription()` · `getParams()` · `handle()`
3. Import + instantiate in `<module>-api.module.ts` inside `getTools()`
4. Run `npm run validate` to check name format

```typescript
// Minimal tool template
export class MyNewTool extends BaseTool {
  getName() { return 'my_tool_name'; }           // snake_case required
  getDescription() { return 'Does X for Y'; }
  getParams(): z.ZodRawShape {
    return { keyword: z.string().describe('Search keyword') };
  }
  async handle(params: any) {
    try {
      const response = await this.dataForSEOClient.makeRequest(
        '/v3/some/endpoint', 'POST', [{ keyword: params.keyword }]
      );
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
}
```

### Adding a Prompt

Add to `<module>.prompt.ts` as a `PromptDefinition`:
- Name: `dfs-<descriptive-kebab-case>`
- Handler returns `{ messages: [{ role: 'user', content: { type: 'text', text: '...' } }] }`

### Adding a Module

1. Create `src/core/modules/<name>/` folder with module class + tools
2. Add name to `AVAILABLE_MODULES` in `src/core/config/modules.config.ts`
3. Add `isModuleEnabled` check in `src/core/utils/module-loader.ts`

---

## Key Conventions

- **Imports** use `.js` extension (ES module, resolved to `.ts` at compile time)
- **Tool names** must be `snake_case` — validated by `npm run validate`
- **Prompt names** must be `dfs-kebab-case`
- **TypeScript strict mode** is on — no implicit `any` except tool `handle()` params
- **Logging** via `console.error()` (stderr — does not interfere with MCP stdio protocol)
- **Response filtering** is on by default — `DATAFORSEO_FULL_RESPONSE=true` to bypass
- **Zod** for all parameter schemas

---

## CI/CD

GitHub Actions (`.github/workflows/publish-npm.yml`) — runs on release:
1. Installs deps + builds
2. Publishes to npm registry
