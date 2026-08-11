/**
 * Debug helper: accepts a single CLI argument string, splits it (quotes supported),
 * then boots src/index.ts in-process so breakpoints work.
 *
 * Example input: docs index --section "SERP API"
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

function shellSplit(input: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(input)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3] ?? "");
  }
  return tokens;
}

const raw = process.argv.slice(2).join(" ").trim();
if (!raw) {
  console.error(
    'Provide CLI args, e.g. docs index --list-sections  or  request -X GET -p /v3/...'
  );
  process.exit(1);
}

const entry = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/index.ts"
);

process.argv = [process.argv[0], entry, ...shellSplit(raw)];
await import(pathToFileURL(entry).href);
