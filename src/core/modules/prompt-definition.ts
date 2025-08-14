import { z } from 'zod';

export interface PromptDefinition {
  name: string;
  title: string;
  description?: string;
  params?: z.ZodRawShape;
  handler: (args: any) => Promise<PromptResult>;
}

export interface PromptResult {
  [x: string]: unknown;
  description?: string;
  messages: PromptResultMessage[];
  _meta?: { [x: string]: unknown; };
}

export interface PromptResultMessage {
  role: "user" | "assistant";
  content: {
    type: "text";
    text: string;
  };

  [x: string]: any;
}