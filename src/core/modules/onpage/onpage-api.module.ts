import { BaseModule, ToolDefinition } from '../base.module.js';
import { PromptDefinition } from '../prompt-definition.js';
import { onpagePrompts } from './onpage.prompt.js';
import { ContentParsingTool } from './tools/content-parsing.tool.js';
import { InstantPagesTool } from './tools/instant-pages.tool.js';

export class OnPageApiModule extends BaseModule {
  getTools(): Record<string, ToolDefinition> {
    const tools = [
      new ContentParsingTool(this.dataForSEOClient),
      new InstantPagesTool(this.dataForSEOClient),
      // Add more tools here
    ];

    return tools.reduce((acc, tool) => ({
      ...acc,
      [tool.getName()]: {
        description: tool.getDescription(),
        params: tool.getParams(),
        handler: (params: any) => tool.handle(params),
      },
    }), {});
  }

    getPrompts(): Record<string, PromptDefinition> {
      return onpagePrompts.reduce((acc, prompt) => ({
        ...acc,
        [prompt.name]: {
          description: prompt.description,
          params: prompt.params,
          handler: (params: any) => {

            return prompt.handler(params);
          },
        },
      }), {});
    }
} 