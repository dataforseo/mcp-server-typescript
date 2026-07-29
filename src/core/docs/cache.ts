import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fetchText } from "../http/fetch.js";
import {
  getConfiguredDocsCacheDir,
  getDocsCacheBackend,
} from "./cache-config.js";

export const DOCS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  fetchedAt: number;
  content: string;
}

const memoryCache = new Map<string, CacheEntry>();

export function resolveDocsCacheDir(cacheDir?: string): string {
  if (cacheDir?.trim()) {
    return path.resolve(cacheDir.trim());
  }

  const configured = getConfiguredDocsCacheDir();
  if (configured) {
    return path.resolve(configured);
  }

  const appName = "dataforseo-mcp-server";
  const cacheSubdir = path.join(appName, "docs-cache");

  if (process.platform === "win32") {
    const base =
      process.env.LOCALAPPDATA ?? process.env.APPDATA ?? os.homedir();
    return path.join(base, cacheSubdir);
  }

  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Caches", cacheSubdir);
  }

  const xdgCache = process.env.XDG_CACHE_HOME;
  if (xdgCache) {
    return path.join(xdgCache, cacheSubdir);
  }

  return path.join(os.homedir(), ".cache", cacheSubdir);
}

function cacheFilePath(cacheDir: string, url: string): string {
  const hash = createHash("sha256").update(url).digest("hex");
  return path.join(cacheDir, `${hash}.json`);
}

function isFetchError(content: string): boolean {
  return /^HTTP \d{3} /.test(content);
}

function readMemoryCachedDoc(url: string): string | null {
  const entry = memoryCache.get(url);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.fetchedAt > DOCS_CACHE_TTL_MS) {
    memoryCache.delete(url);
    return null;
  }
  return entry.content;
}

function writeMemoryCachedDoc(url: string, content: string): void {
  memoryCache.set(url, { fetchedAt: Date.now(), content });
}

async function readCachedDoc(
  url: string,
  cacheDir: string
): Promise<string | null> {
  try {
    const raw = await readFile(cacheFilePath(cacheDir, url), "utf8");
    const entry = JSON.parse(raw) as CacheEntry;

    if (Date.now() - entry.fetchedAt > DOCS_CACHE_TTL_MS) {
      return null;
    }

    return entry.content;
  } catch {
    return null;
  }
}

async function writeCachedDoc(
  url: string,
  cacheDir: string,
  content: string
): Promise<void> {
  const entry: CacheEntry = {
    fetchedAt: Date.now(),
    content,
  };

  await mkdir(cacheDir, { recursive: true });
  await writeFile(cacheFilePath(cacheDir, url), JSON.stringify(entry), "utf8");
}

export async function fetchDocText(
  url: string,
  cacheDir?: string
): Promise<string> {
  if (getDocsCacheBackend() === "memory") {
    const cached = readMemoryCachedDoc(url);
    if (cached !== null) {
      return cached;
    }

    const content = await fetchText(url);
    if (!isFetchError(content)) {
      writeMemoryCachedDoc(url, content);
    }
    return content;
  }

  const dir = resolveDocsCacheDir(cacheDir);
  const cached = await readCachedDoc(url, dir);

  if (cached !== null) {
    return cached;
  }

  const content = await fetchText(url);

  if (!isFetchError(content)) {
    try {
      await writeCachedDoc(url, dir, content);
    } catch {
      // Cache write failures should not block documentation fetch.
    }
  }

  return content;
}
