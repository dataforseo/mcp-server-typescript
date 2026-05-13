import { DataForSEOClient } from '../client/dataforseo.client.js';
import { z } from 'zod';
import { PromptDefinition } from './prompt-definition.js';

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

  abstract getTools(): Record<string, ToolDefinition>;

  abstract getPrompts(): Record<string, PromptDefinition>;
} 