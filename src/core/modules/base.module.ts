import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { DataForSEOClient } from '../client/dataforseo.client.js';
import { z } from 'zod';
import { BaseTool } from './base.tool.js';
import { PromptDefinition } from './prompt-definition.js';

export interface ToolDefinition {
  title: string;
  description: string;
  params: z.ZodRawShape;
  handler: (params: any) => Promise<any>;
  annotations: ToolAnnotations;
}

export function buildToolDefinition(tool: BaseTool): ToolDefinition {
  const definition: ToolDefinition = {
    title: tool.getTitle(),
    description: tool.getDescription(),
    params: tool.getParams(),
    annotations: tool.getAnnotations(),
    handler: (params: any) => tool.handle(params),
  };

  return definition;
}

export function buildToolsRecord(tools: BaseTool[]): Record<string, ToolDefinition> {
  return tools.reduce((acc, tool) => ({
    ...acc,
    [tool.getName()]: buildToolDefinition(tool),
  }), {});
}

export abstract class BaseModule {
  protected dataForSEOClient: DataForSEOClient;

  constructor(dataForSEOClient: DataForSEOClient) {
    this.dataForSEOClient = dataForSEOClient;
  }

  abstract getTools(): Record<string, ToolDefinition>;

  abstract getPrompts(): Record<string, PromptDefinition>;
} 