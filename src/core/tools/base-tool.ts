import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { Command } from "commander";
import { z } from "zod";
import { DEFAULT_READ_ONLY_TOOL_ANNOTATIONS } from "./tool-annotations.js";
import type { ToolResult } from "./types.js";
import { errorResult } from "./types.js";

export abstract class BaseTool<TInput> {
  abstract readonly name: string;
  abstract readonly title: string;
  abstract readonly description: string;
  abstract readonly schema: z.ZodType<TInput>;

  getAnnotations(): ToolAnnotations {
    return DEFAULT_READ_ONLY_TOOL_ANNOTATIONS;
  }

  registerCli?(_program: Command): void;

  protected abstract execute(input: TInput): Promise<ToolResult>;

  async invoke(args: unknown): Promise<ToolResult> {
    try {
      const input = this.schema.parse(args);
      return await this.execute(input);
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
}
