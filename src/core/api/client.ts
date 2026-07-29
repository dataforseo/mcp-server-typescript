import { API_BASE_URL } from "../../config/index.js";
import { getUserAgent } from "../version.js";
import {
  buildAuthHeader,
  getCredentials,
  type Credentials,
} from "./auth.js";

export interface ApiRequestOptions {
  method: string;
  path: string;
  body?: string;
  credentials?: Credentials;
  authHeader?: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}

export async function makeApiRequest(
  options: ApiRequestOptions
): Promise<ApiResponse> {
  const authorization =
    options.authHeader ??
    buildAuthHeader(options.credentials ?? getCredentials());
  const url = options.path.startsWith("http")
    ? options.path
    : `${API_BASE_URL}${options.path.startsWith("/") ? "" : "/"}${options.path}`;

  const headers: Record<string, string> = {
    Authorization: authorization,
    "User-Agent": getUserAgent(),
  };

  const method = options.method.toUpperCase();
  const init: RequestInit = { method, headers };

  if (options.body && method !== "GET" && method !== "HEAD") {
    headers["Content-Type"] = "application/json";
    init.body = options.body;
  }

  const response = await fetch(url, init);
  const body = await response.text();

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  return {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    body,
  };
}
