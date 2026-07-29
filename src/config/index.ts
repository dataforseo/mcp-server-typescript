import { getEnv } from "../core/env.js";

export const DOCS_BASE_URL = "https://docs.dataforseo.com/v3";
export const LLMS_INDEX_URL = `${DOCS_BASE_URL}/llms.txt`;
export const API_BASE_URL = "https://api.dataforseo.com";
export const DEFAULT_AUTH_SERVER_URL = "https://data.dataforseo.com";

/** Lazily resolved so Cloudflare Worker env bindings are visible. */
export function getAuthServerUrl(): string {
  return getEnv("AUTH_SERVER_URL") ?? DEFAULT_AUTH_SERVER_URL;
}

export const AVAILABLE_SECTIONS = [
  "SERP API",
  "AI Optimization API",
  "Keywords Data API",
  "Domain Analytics API",
  "DataForSEO Labs API",
  "OnPage API",
  "Backlinks API",
  "Content Analysis API",
  "Merchant API",
  "App Data API",
  "Business Data API",
  "Databases",
  "Appendix",
] as const;
