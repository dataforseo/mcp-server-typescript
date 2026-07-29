import { tryGetEnvAuthHeader } from "./auth.js";
import { getTokenExpiration } from "./token-expiry.js";

const CLOCK_SKEW_MS = 10_000;

/** Scopes required to call the DataForSEO API with an OAuth access token. */
export const OAUTH_SCOPES = ["api"] as const;

export type ResolveAuthResult =
  | { ok: true; authHeader: string; source: "basic" | "bearer" | "env" }
  | {
      ok: false;
      reason: "expired_bearer" | "missing";
    };

function normalizeAuthHeader(
  authorization: string | undefined
): string | undefined {
  if (!authorization) {
    return undefined;
  }
  const match = /^(Basic|Bearer)\s+(.+)$/i.exec(authorization.trim());
  if (!match) {
    return authorization.trim() || undefined;
  }
  const scheme = match[1].toLowerCase() === "basic" ? "Basic" : "Bearer";
  return `${scheme} ${match[2].trim()}`;
}

/**
 * Auth priority (OAuth/Bearer preferred, env as fallback):
 * 1. Authorization: Basic
 * 2. Authorization: Bearer (reject if JWT exp is past)
 * 3. DATAFORSEO_LOGIN/USERNAME + DATAFORSEO_PASSWORD from env
 */
export function resolveAuthHeader(
  authorization: string | undefined
): ResolveAuthResult {
  const normalized = normalizeAuthHeader(authorization);

  if (normalized?.startsWith("Basic ")) {
    return { ok: true, authHeader: normalized, source: "basic" };
  }

  if (normalized?.startsWith("Bearer ")) {
    const expirationDate = getTokenExpiration(normalized);
    if (
      expirationDate &&
      expirationDate.getTime() + CLOCK_SKEW_MS <= Date.now()
    ) {
      return { ok: false, reason: "expired_bearer" };
    }
    return { ok: true, authHeader: normalized, source: "bearer" };
  }

  const envAuthHeader = tryGetEnvAuthHeader();
  if (envAuthHeader) {
    return { ok: true, authHeader: envAuthHeader, source: "env" };
  }

  return { ok: false, reason: "missing" };
}

export function buildWwwAuthenticateHeader(
  resourceMetadataUrl: string,
  reason: "expired_bearer" | "missing"
): string {
  const scope = `scope="${OAUTH_SCOPES.join(" ")}"`;
  if (reason === "expired_bearer") {
    return `Bearer error="invalid_token", error_description="access token expired", resource_metadata="${resourceMetadataUrl}", ${scope}`;
  }
  return `Bearer error="invalid_token", error_description="token is null or empty", resource_metadata="${resourceMetadataUrl}", ${scope}`;
}

export function oauthProtectedResourcePayload(
  resource: string,
  authorizationServerUrl: string
) {
  return {
    resource,
    authorization_servers: [authorizationServerUrl],
    scopes_supported: [...OAUTH_SCOPES],
    bearer_methods_supported: ["header"],
  };
}
