import { z } from 'zod';
import { PromptDefinition } from '../prompt-definition.js';

export const keywordsDataPrompts: PromptDefinition[] = [
  {
    name: 'keywords_trends',
    title: 'Search Keywords Trends',
    params: {
        keyword: z.string().describe('The eco-friendly keyword to search for'),
        location: z.string().describe('The location to search in')
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `What keywords related to '${params.keyword}' are trending this month in ${params.location}?`
            }
          }
        ]
      };
    }
  },
]