---
applyTo: "src/**/*.ts"
---

# TypeScript Conventions — DataForSEO MCP Server

## Imports

Always use `.js` extension (resolved to `.ts` by Node16 module resolution):

```typescript
// ✅ correct
import { BaseTool } from '../../base.tool.js';
import { z } from 'zod';

// ❌ wrong
import { BaseTool } from '../../base.tool.ts';
import { BaseTool } from '../../base.tool';
```

## Tool Pattern

Every tool extends `BaseTool` and lives in `src/core/modules/<module>/tools/`:

```typescript
export class MyTool extends BaseTool {
  getName(): string { return 'my_tool_name'; }    // snake_case
  getDescription(): string { return '...'; }
  getParams(): z.ZodRawShape {
    return {
      keyword: z.string().describe('Keyword to search'),  // .describe() is required
    };
  }
  async handle(params: any) {
    try {
      const r = await this.dataForSEOClient.makeRequest('/v3/...', 'POST', [params]);
      return this.validateAndFormatResponse(r);
    } catch (e) {
      return this.formatErrorResponse(e);
    }
  }
}
```

## Logging

```typescript
console.error('debug info');   // ✅ stderr — safe for MCP stdio
console.log('output');         // ❌ breaks MCP stdio protocol
```

## Zod Rules

- Every param field must have `.describe()` with a clear description
- Use `.default()` for optional fields with sensible defaults
- Use `z.number().min().max()` for bounded numerics
