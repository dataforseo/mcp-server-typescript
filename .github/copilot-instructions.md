# DataForSEO MCP Server — Copilot Instructions

## What This Repo Is

TypeScript MCP server that exposes DataForSEO APIs as tools and prompts for AI assistants.
Read `AGENTS.md` for the full architecture guide.

## Code Conventions (Always Follow)

- **Tool names** → `snake_case` (e.g. `serp_organic_live_advanced`)
- **Prompt names** → `dfs-kebab-case` (e.g. `dfs-local-seo-comparison`)
- **All imports** → use `.js` extension, never `.ts` (ES modules: `import { X } from './x.js'`)
- **Logging** → `console.error()` only — never `console.log()` (breaks MCP stdio)
- **Zod** → all tool params defined with Zod schemas + `.describe()` on every field
- **TypeScript strict** → no `any` except in `handle(params: any)` signatures

## When Adding a Tool

Always extend `BaseTool`, implement `getName/getDescription/getParams/handle`, then register in the module's `getTools()` array. Run `npm run validate` after.

## When Adding a Prompt

Add to the module's `.prompt.ts` file as a `PromptDefinition`. Name must start with `dfs-`. Handler returns `{ messages: [{ role: 'user', content: { type: 'text', text: '...' } }] }`.

## When Adding a Module

1. Add to `AVAILABLE_MODULES` in `src/core/config/modules.config.ts`
2. Add loader block in `src/core/utils/module-loader.ts`
3. Create folder `src/core/modules/<name>/` with module class + tools

## Build Commands

```bash
npm run build      # compile TypeScript
npm run validate   # build + verify tool names
npm run dev        # watch mode
```

## Do Not

- Use `console.log()` anywhere in server code
- Skip `.describe()` on Zod fields — descriptions are shown to the AI model calling the tool
- Import with `.ts` extension
- Add `any` types outside of `handle()` params without a comment explaining why
