import { isLiveEndpoint } from "../live-endpoint.js";
import type {
  ApiRequestMiddleware,
  ApiRequestMiddlewareContext,
  ApiRequestMiddlewareResult,
} from "./api-request-middleware.js";

/**
 * Enforces the Live-endpoint rule: only the first task object is sent.
 */
export class LiveEndpointApiRequestMiddleware implements ApiRequestMiddleware {
  readonly name = "live-endpoint-single-task";

  apply(ctx: ApiRequestMiddlewareContext): ApiRequestMiddlewareResult {
    if (ctx.body === undefined || !isLiveEndpoint(ctx.path)) {
      return { body: ctx.body, warnings: [] };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(ctx.body);
    } catch {
      return { body: ctx.body, warnings: [] };
    }

    if (!Array.isArray(parsed) || parsed.length <= 1) {
      return { body: ctx.body, warnings: [] };
    }

    return {
      body: JSON.stringify([parsed[0]]),
      warnings: [
        "Warning: Live endpoints allow only 1 task per request. Extra tasks in the request body were ignored; the response is for the first task only.",
      ],
    };
  }
}
