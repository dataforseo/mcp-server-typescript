import type { NextFunction, Request as ExpressRequest, Response } from "express";
import { getAuthServerUrl } from "../config/index.js";
import {
  buildWwwAuthenticateHeader,
  oauthProtectedResourcePayload,
  resolveAuthHeader,
} from "../core/api/resolve-auth.js";
import { getEnv } from "../core/env.js";

export interface AuthenticatedRequest extends ExpressRequest {
  authHeader?: string;
}

function isDebugEnabled(): boolean {
  return getEnv("DEBUG") === "true";
}

function resourceMetadataUrl(req: AuthenticatedRequest): string {
  return `${req.protocol}://${req.get("host")}/.well-known/oauth-protected-resource`;
}

export function createAuthMiddleware() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const metadataUrl = resourceMetadataUrl(req);
    const resolved = resolveAuthHeader(req.headers.authorization);

    if (!resolved.ok) {
      if (isDebugEnabled()) {
        console.log(`auth rejected: ${resolved.reason}`);
      }
      res.setHeader(
        "WWW-Authenticate",
        buildWwwAuthenticateHeader(metadataUrl, resolved.reason)
      );
      res.status(401).json({
        error:
          resolved.reason === "expired_bearer"
            ? "invalid_token"
            : "invalid auth",
        error_description:
          resolved.reason === "expired_bearer"
            ? "expired bearer token"
            : "invalid auth",
      });
      return;
    }

    if (isDebugEnabled()) {
      console.log(`auth source: ${resolved.source}`);
    }

    req.authHeader = resolved.authHeader;
    next();
  };
}

/**
 * Always registered: OAuth discovery is the default auth path.
 * Env credentials remain a request-time fallback in createAuthMiddleware.
 */
export function registerOAuthProtectedResourceRoutes(
  app: import("express").Express
): void {
  const protectedResourceHandler =
    (resourcePath: string) => (req: AuthenticatedRequest, res: Response) => {
      const base = `${req.protocol}://${req.get("host")}`;
      const resource = resourcePath ? `${base}/${resourcePath}` : base;
      const payload = oauthProtectedResourcePayload(
        resource,
        getAuthServerUrl()
      );

      if (isDebugEnabled()) {
        console.log(
          `.well-known/oauth-protected-resource resp payload: ${JSON.stringify(payload)}`
        );
      }

      res.json(payload);
    };

  app.get(
    "/.well-known/oauth-protected-resource",
    protectedResourceHandler("")
  );
  app.get(
    "/.well-known/oauth-protected-resource/mcp",
    protectedResourceHandler("mcp")
  );
  app.get(
    "/.well-known/oauth-protected-resource/http",
    protectedResourceHandler("http")
  );
}
