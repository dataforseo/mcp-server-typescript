import { AsyncLocalStorage } from "node:async_hooks";

const clientUserAgentStorage = new AsyncLocalStorage<{
  clientUserAgent?: string;
}>();

export function sanitizeUserAgent(value: unknown): string | undefined {
  const raw = Array.isArray(value)
    ? value.find((item) => typeof item === "string")
    : value;
  if (typeof raw !== "string") {
    return undefined;
  }

  const sanitized = raw.replace(/[\r\n]+/g, " ").trim();
  return sanitized.length > 0 ? sanitized : undefined;
}

function headerValue(
  headers: Record<string, unknown>,
  name: string
): unknown {
  if (name in headers) {
    return headers[name];
  }

  const lower = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) {
      return headers[key];
    }
  }

  return undefined;
}

/** User-Agent from the HTTP request that invoked the tool, when the transport provides it. */
export function clientUserAgentFromExtra(extra: unknown): string | undefined {
  if (!extra || typeof extra !== "object") {
    return undefined;
  }

  const headers = (extra as { requestInfo?: { headers?: Record<string, unknown> } })
    .requestInfo?.headers;
  if (!headers) {
    return undefined;
  }

  return sanitizeUserAgent(headerValue(headers, "user-agent"));
}

export function runWithClientUserAgent<T>(
  clientUserAgent: string | undefined,
  fn: () => T
): T {
  return clientUserAgentStorage.run({ clientUserAgent }, fn);
}

export function getClientUserAgent(): string | undefined {
  return clientUserAgentStorage.getStore()?.clientUserAgent;
}

/** Client product tokens first, then the DataForSEO MCP product token. */
export function combineUserAgents(
  clientUserAgent: string | undefined,
  productUserAgent: string
): string {
  const client = sanitizeUserAgent(clientUserAgent);
  if (!client) {
    return productUserAgent;
  }

  const tokens = client.split(/[ \t]+/);
  if (tokens.includes(productUserAgent)) {
    return client;
  }

  return `${client} ${productUserAgent}`;
}

export function resolveOutboundUserAgent(productUserAgent: string): string {
  return combineUserAgents(getClientUserAgent(), productUserAgent);
}
