/**
 * Shared Live-endpoint helpers used by api-request and docs middleware.
 */

export function isLiveEndpoint(pathOrUrl: string): boolean {
  return /(?:^|\/)live(?:\/|\.ai|$)/i.test(extractPathname(pathOrUrl));
}

function extractPathname(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    try {
      return new URL(pathOrUrl).pathname;
    } catch {
      return pathOrUrl.split("?")[0] ?? pathOrUrl;
    }
  }

  return pathOrUrl.split("?")[0] ?? pathOrUrl;
}
