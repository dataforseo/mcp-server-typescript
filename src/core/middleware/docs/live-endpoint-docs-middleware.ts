import { isLiveEndpoint } from "../live-endpoint.js";
import type {
  DocsMiddleware,
  DocsMiddlewareContext,
  DocsMiddlewareResult,
} from "./docs-middleware.js";

/**
 * Appends Live-endpoint mandatory rules to documentation content.
 */
export class LiveEndpointDocsMiddleware implements DocsMiddleware {
  readonly name = "live-endpoint-rules";

  apply(ctx: DocsMiddlewareContext): DocsMiddlewareResult {
    if (!isLiveEndpoint(ctx.docUrl)) {
      return { content: ctx.content };
    }

    return {
      content: [
        "",
        "## Mandatory rules",
        "- Use only 1 task per request. For multiple tasks make separate requests.",
        "",
        ctx.content.trimEnd(),
      ].join("\n"),
    };
  }
}
