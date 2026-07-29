export type DocsCacheBackend = "filesystem" | "memory";

let configuredDocsCacheDir: string | undefined;
let docsCacheBackend: DocsCacheBackend = "filesystem";

export function setDocsCacheDir(dir: string): void {
  const trimmed = dir.trim();
  configuredDocsCacheDir = trimmed || undefined;
}

export function getConfiguredDocsCacheDir(): string | undefined {
  return configuredDocsCacheDir;
}

export function setDocsCacheBackend(backend: DocsCacheBackend): void {
  docsCacheBackend = backend;
}

export function getDocsCacheBackend(): DocsCacheBackend {
  return docsCacheBackend;
}
