import type { Command } from "commander";
import { z } from "zod";
import { LLMS_INDEX_URL } from "../../config/index.js";
import { printError } from "../cli/error.js";
import { printToolResult } from "../cli/output.js";
import { fetchDocText } from "../docs/cache.js";
import { docsCacheDirSchema } from "../docs/cache-options.js";
import { filterBySection } from "../docs/section.js";
import { BaseTool } from "./base-tool.js";
import { DocsListSectionsTool } from "./docs-list-sections-tool.js";
import { errorResult, textResult } from "./types.js";

export const docsIndexMcpInputSchema = z.object({
  section: z
    .string()
    .optional()
    .describe('Filter by API section (e.g. "SERP API")'),
});

export const docsIndexCliInputSchema = docsIndexMcpInputSchema.extend({
  cacheDir: docsCacheDirSchema,
});

export type DocsIndexMcpInput = z.infer<typeof docsIndexMcpInputSchema>;
export type DocsIndexCliInput = z.infer<typeof docsIndexCliInputSchema>;

export class DocsIndexTool extends BaseTool<DocsIndexMcpInput> {
  readonly name = "docs_index";
  readonly title = "Docs Index";
  readonly description =
    "Fetch the DataForSEO API documentation index (llms.txt), optionally filtered by section";
  readonly schema = docsIndexMcpInputSchema;

  protected async execute(input: DocsIndexMcpInput) {
    const content = await fetchDocText(LLMS_INDEX_URL);

    if (!input.section) {
      return textResult(content);
    }

    return textResult(filterBySection(content, input.section));
  }

  async invokeCli(args: unknown) {
    try {
      const input = docsIndexCliInputSchema.parse(args);
      const content = await fetchDocText(LLMS_INDEX_URL, input.cacheDir);

      if (!input.section) {
        return textResult(content);
      }

      return textResult(filterBySection(content, input.section));
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
      .command("index")
      .description("Fetch the DataForSEO API documentation index (llms.txt)")
      .option(
        "-s, --section <name>",
        'Filter by API section (e.g. "SERP API", "DataForSEO Labs API")'
      )
      .option("--list-sections", "List available section names")
      .option(
        "--cache-dir <path>",
        "Custom documentation cache directory (default: AppData Local, TTL 24h)"
      )
      .action(
        async (options: {
          section?: string;
          listSections?: boolean;
          cacheDir?: string;
        }) => {
          try {
            if (options.listSections) {
              printToolResult(await new DocsListSectionsTool().invoke({}));
              return;
            }

            const result = await this.invokeCli({
              section: options.section,
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
