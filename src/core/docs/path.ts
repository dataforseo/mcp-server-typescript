import { DOCS_BASE_URL } from "../../config/index.js";

export function normalizeDocPath(input: string): string {
  let path = input.trim();

  if (path.startsWith("http://") || path.startsWith("https://")) {
    const url = new URL(path);
    path = url.pathname;
  }

  path = path.replace(/^\/v3\//, "").replace(/^\//, "");

  if (!path.endsWith(".md")) {
    path = `${path}.md`;
  }

  return path;
}

export function buildDocUrl(path: string): string {
  const normalized = normalizeDocPath(path);
  return `${DOCS_BASE_URL}/${normalized}/`;
}
