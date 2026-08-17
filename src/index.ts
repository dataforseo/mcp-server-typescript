#!/usr/bin/env node

import { initializeFieldConfiguration } from "./core/config/field-configuration.js";
import { parseMcpStartupArgs } from "./core/mcp/args.js";

const CLI_COMMANDS = new Set(["docs", "request"]);
const STARTUP_FLAGS_WITH_VALUE = new Set([
  "--mode",
  "--docs-cache-dir",
  "--configuration",
]);

function parseRuntimeArgs(argv: string[]): {
  isCli: boolean;
  mode: "stdio" | "http";
} {
  let mode: "stdio" | "http" = "stdio";

  const modeIndex = argv.indexOf("--mode");
  if (modeIndex !== -1) {
    const value = argv[modeIndex + 1];
    if (value === "http" || value === "stdio") {
      mode = value;
    }
  }

  const firstPositional = argv.find((arg, index) => {
    if (arg.startsWith("-")) {
      return false;
    }
    const prev = argv[index - 1];
    return !(prev && STARTUP_FLAGS_WITH_VALUE.has(prev));
  });
  const isCli =
    argv.includes("--cli") ||
    argv.includes("-h") ||
    argv.includes("--help") ||
    argv.includes("-V") ||
    argv.includes("--version") ||
    (firstPositional !== undefined && CLI_COMMANDS.has(firstPositional));

  return { isCli, mode };
}

function stripStartupFlags(argv: string[]): void {
  const flagsToStrip = [
    "--cli",
    "--configuration",
    "--docs-cache-dir",
  ];

  for (const flag of flagsToStrip) {
    let index = argv.indexOf(flag);
    while (index !== -1) {
      const next = argv[index + 1];
      const removeCount =
        flag === "--cli" || !next || next.startsWith("-") ? 1 : 2;
      argv.splice(index, removeCount);
      index = argv.indexOf(flag);
    }
  }
}

const runtimeArgs = process.argv.slice(2);
parseMcpStartupArgs(runtimeArgs);
await initializeFieldConfiguration();

const { isCli, mode } = parseRuntimeArgs(runtimeArgs);

if (isCli) {
  stripStartupFlags(process.argv);
  await import("./core/cli/program.js");
} else {
  if (mode === "stdio") {
    await import("./mcp/index.js");
  } else {
    await import("./mcp/index-http.js");
  }
}
