import { DataForSEOClient } from '../client/dataforseo.client.js';
import { z } from 'zod';

export interface ToolDefinition {
  description: string;
  params: z.ZodRawShape;
  handler: (params: any) => Promise<any>;
}

export abstract class BaseModule {
  protected dataForSEOClient: DataForSEOClient;

  constructor(dataForSEOClient: DataForSEOClient) {
    this.dataForSEOClient = dataForSEOClient;
  }

  protected formatError(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  protected formatResponse(data: any): { content: Array<{ type: string; text: string }> } {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  protected formatErrorResponse(error: unknown): { content: Array<{ type: string; text: string }> } {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${this.formatError(error)}`,
        },
      ],
    };
  }

  abstract getTools(): Record<string, ToolDefinition>;
} 