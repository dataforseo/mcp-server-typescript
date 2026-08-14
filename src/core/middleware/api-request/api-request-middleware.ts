export interface ApiRequestMiddlewareContext {
  method: string;
  path: string;
  body: string | undefined;
}

export interface ApiRequestMiddlewareResult {
  body: string | undefined;
  warnings: string[];
}

/**
 * Pre-request middleware for api_request. Each middleware may rewrite the body
 * and/or emit warnings that are prepended to the tool response.
 */
export interface ApiRequestMiddleware {
  readonly name: string;
  apply(ctx: ApiRequestMiddlewareContext): ApiRequestMiddlewareResult;
}
