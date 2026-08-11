/**
 * Extracts the expiration instant from a Bearer JWT *without* verifying its
 * signature. We never trust this token — DataForSEO remains the authoritative
 * validator — we only peek at `exp` to detect an honestly expired token and
 * turn it into a 401 + WWW-Authenticate challenge so the MCP client refreshes.
 */
export function getTokenExpiration(authHeader: string | undefined): Date | null {
  if (!authHeader || !/^Bearer\s+/i.test(authHeader)) return null;

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as { exp?: unknown };

    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
      return null;
    }

    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );

  if (typeof Buffer !== "undefined") {
    return Buffer.from(padded, "base64").toString("utf-8");
  }

  return atob(padded);
}
