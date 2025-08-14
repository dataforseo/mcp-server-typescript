import { z } from 'zod';
import { PromptDefinition } from '../prompt-definition.js';


export const contentAnalysisPrompts: PromptDefinition[] = [
      {
    name: 'sites_content_gap',
    title: 'Sites Content Gap',
    params: {
      url1: z.string().describe('The first URL to analyze'),
      url2: z.string().describe('The second URL to analyze'),
      topic: z.string().describe('The topic to focus on'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Identify content gaps between ${params.url1} and ${params.url2} for the topic '${params.topic}'`
            }
          }
        ]
      };
    }
  },
]