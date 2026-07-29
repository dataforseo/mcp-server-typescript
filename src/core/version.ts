import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

declare global {
  // eslint-disable-next-line no-var
  var __PACKAGE_VERSION__: string | undefined;
  // eslint-disable-next-line no-var
  var __PACKAGE_NAME__: string | undefined;
}

const DEFAULT_VERSION = "1.0.0";
const DEFAULT_NAME = "dataforseo-mcp-server";

let cachedPackage: { version: string; name: string } | undefined;

function readPackageJson(): { version: string; name: string } {
  if (cachedPackage) {
    return cachedPackage;
  }

  cachedPackage = { version: DEFAULT_VERSION, name: DEFAULT_NAME };

  try {
    const packageJsonPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "../../package.json"
    );
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      version?: string;
      name?: string;
    };
    cachedPackage = {
      version: packageJson.version ?? DEFAULT_VERSION,
      name: packageJson.name ?? DEFAULT_NAME,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("Could not read package.json, using default version:", message);
  }

  return cachedPackage;
}

export function getPackageVersion(): string {
  return globalThis.__PACKAGE_VERSION__ ?? readPackageJson().version;
}

export function getPackageName(): string {
  return globalThis.__PACKAGE_NAME__ ?? readPackageJson().name;
}

export function getUserAgent(): string {
  return `DataForSEO-MCP-Server-${getPackageVersion()}`;
}

/** @deprecated Prefer getPackageVersion() for Worker-safe lazy resolution. */
export const version = getPackageVersion();
/** @deprecated Prefer getPackageName() for Worker-safe lazy resolution. */
export const name = getPackageName();
/** @deprecated Prefer getUserAgent(). */
export const userAgent = getUserAgent();
