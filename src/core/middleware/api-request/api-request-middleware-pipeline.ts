import type {
  ApiRequestMiddleware,
  ApiRequestMiddlewareContext,
  ApiRequestMiddlewareResult,
} from "./api-request-middleware.js";
import { LiveEndpointApiRequestMiddleware } from "./live-endpoint-api-request-middleware.js";

export class ApiRequestMiddlewarePipeline {
  constructor(private readonly middlewares: readonly ApiRequestMiddleware[]) {}

  apply(ctx: ApiRequestMiddlewareContext): ApiRequestMiddlewareResult {
    let body = ctx.body;
    const warnings: string[] = [];

    for (const middleware of this.middlewares) {
      const result = middleware.apply({ ...ctx, body });
      body = result.body;
      warnings.push(...result.warnings);
    }

    return { body, warnings };
  }
}

/**
 * Default pre-request middleware for api_request.
 * Add new ApiRequestMiddleware implementations here to extend behavior.
 */
export const apiRequestMiddlewarePipeline = new ApiRequestMiddlewarePipeline([
  new LiveEndpointApiRequestMiddleware(),
]);
