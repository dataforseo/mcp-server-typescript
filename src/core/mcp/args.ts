import { setDocsCacheDir } from "../docs/cache-config.js";

const DOCS_CACHE_DIR_FLAG = "--docs-cache-dir";
const CONFIGURATION_FLAG = "--configuration";

function takeFlagValue(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  if (index === -1 || !argv[index + 1]) {
    return undefined;
  }
  return argv[index + 1];
}

/**
 * Parse MCP/CLI startup flags that configure process-wide behavior.
 * Sets FIELD_CONFIG_PATH when --configuration is passed.
 */
export function parseMcpStartupArgs(argv: string[]): void {
  const docsCacheDir = takeFlagValue(argv, DOCS_CACHE_DIR_FLAG);
  if (docsCacheDir) {
    setDocsCacheDir(docsCacheDir);
  }

  const configPath = takeFlagValue(argv, CONFIGURATION_FLAG);
  if (configPath) {
    process.env.FIELD_CONFIG_PATH = configPath;
    console.error(`Using field configuration: ${configPath}`);
  }
}
