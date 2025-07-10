// Environment detection and version loading for both Node.js and Workers
let packageVersion = '1.0.0'; // Default version
let packageName = 'dataforseo-mcp-server'; // Default name

// Type declarations for worker environment globals
declare global {
  var __PACKAGE_VERSION__: string | undefined;
  var __PACKAGE_NAME__: string | undefined;
}

// Check if we're in a Node.js environment (has fs module)
const isNodeEnvironment = typeof globalThis !== 'undefined' && 
  typeof globalThis.process !== 'undefined' && 
  globalThis.process.versions?.node;

if (isNodeEnvironment) {
  // Node.js environment - read from package.json
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    // Get the directory of the current module
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const packageJsonPath = path.resolve(__dirname, '../../../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageVersion = packageJson.version || packageVersion;
    packageName = packageJson.name || packageName;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('Could not read package.json, using default version:', errorMessage);
  }
} else {
  // Worker environment - use compile-time constants
  // These will be replaced by the build process or use defaults
  packageVersion = globalThis.__PACKAGE_VERSION__ || packageVersion;
  packageName = globalThis.__PACKAGE_NAME__ || packageName;
}

export const version = packageVersion;
export const name = packageName;

export default {
  version,
  name
};