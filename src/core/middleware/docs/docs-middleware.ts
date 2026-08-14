export interface DocsMiddlewareContext {
  docUrl: string;
  content: string;
}

export interface DocsMiddlewareResult {
  content: string;
}

/**
 * Post-fetch middleware for docs_search. Each middleware may rewrite content
 * (e.g. append endpoint-specific rules) before it is returned to the client.
 */
export interface DocsMiddleware {
  readonly name: string;
  apply(ctx: DocsMiddlewareContext): DocsMiddlewareResult;
}
