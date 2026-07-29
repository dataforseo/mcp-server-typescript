import type { ToolResult } from "../tools/types.js";

export function printToolResult(result: ToolResult): void {
  const writer = result.isError
    ? console.error.bind(console)
    : console.log.bind(console);

  for (const block of result.content) {
    writer(block.text);
  }

  if (result.isError) {
    process.exit(1);
  }
}
