import type {
  DocsMiddleware,
  DocsMiddlewareContext,
  DocsMiddlewareResult,
} from "./docs-middleware.js";
import { LiveEndpointDocsMiddleware } from "./live-endpoint-docs-middleware.js";

export class DocsMiddlewarePipeline {
  constructor(private readonly middlewares: readonly DocsMiddleware[]) {}

  apply(ctx: DocsMiddlewareContext): DocsMiddlewareResult {
    let content = ctx.content;

    for (const middleware of this.middlewares) {
      const result = middleware.apply({ ...ctx, content });
      content = result.content;
    }

    return { content };
  }
}

/**
 * Default post-fetch middleware for docs_search.
 * Add new DocsMiddleware implementations here to extend behavior.
 */
export const docsMiddlewarePipeline = new DocsMiddlewarePipeline([
  new LiveEndpointDocsMiddleware(),
]);
