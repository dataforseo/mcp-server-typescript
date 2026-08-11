import type { Command } from "commander";
import { z } from "zod";
import { printError } from "../cli/error.js";
import { printToolResult } from "../cli/output.js";
import { fetchDocText } from "../docs/cache.js";
import { docsCacheDirSchema } from "../docs/cache-options.js";
import { buildDocUrl } from "../docs/path.js";
import { stripCodeExamples } from "../docs/strip-code-examples.js";
import { BaseTool } from "./base-tool.js";
import { errorResult, textResult } from "./types.js";

export const docsSearchMcpInputSchema = z.object({
  url: z
    .string()
    .describe(
      "Documentation URL or path (e.g. https://docs.dataforseo.com/v3/serp/google/organic/live/regular or serp/google/organic/live/regular)"
    ),
  needCodeExample: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Include multi-language code examples (PHP, Node.js, Python, C#)"
    ),
});

export const docsSearchCliInputSchema = docsSearchMcpInputSchema.extend({
  cacheDir: docsCacheDirSchema,
});

export type DocsSearchMcpInput = z.infer<typeof docsSearchMcpInputSchema>;
export type DocsSearchCliInput = z.infer<typeof docsSearchCliInputSchema>;

export class DocsSearchTool extends BaseTool<DocsSearchMcpInput> {
  readonly name = "docs_search";
  readonly title = "Docs Search";
  readonly description =
    "Fetch DataForSEO API documentation from a documentation URL";
  readonly schema = docsSearchMcpInputSchema;

  protected async execute(input: DocsSearchMcpInput) {
    const docUrl = buildDocUrl(input.url);
    let content = await fetchDocText(docUrl);

    if (!input.needCodeExample) {
      content = stripCodeExamples(content);
    }

    return textResult(content);
  }

  async invokeCli(args: unknown) {
    try {
      const input = docsSearchCliInputSchema.parse(args);
      const docUrl = buildDocUrl(input.url);
      let content = await fetchDocText(docUrl, input.cacheDir);

      if (!input.needCodeExample) {
        content = stripCodeExamples(content);
      }

      return textResult(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
        return errorResult(`Invalid input: ${details}`);
      }

      const message = error instanceof Error ? error.message : String(error);
      return errorResult(message);
    }
  }

  registerCli(docs: Command): void {
    docs
      .command("search <url>")
      .description("Fetch documentation from a documentation URL or path")
      .option(
        "--need-code-example",
        "Include multi-language code examples (PHP, Node.js, Python, C#)"
      )
      .option(
        "--cache-dir <path>",
        "Custom documentation cache directory (default: AppData Local, TTL 24h)"
      )
      .action(
        async (
          url: string,
          options: { needCodeExample?: boolean; cacheDir?: string }
        ) => {
          try {
            const result = await this.invokeCli({
              url,
              needCodeExample: options.needCodeExample ?? false,
              cacheDir: options.cacheDir,
            });
            printToolResult(result);
          } catch (error) {
            printError(error);
          }
        }
      );
  }
}
