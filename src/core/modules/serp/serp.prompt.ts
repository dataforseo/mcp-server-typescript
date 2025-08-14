import { z } from 'zod';
import { PromptDefinition } from '../prompt-definition.js';


export const serpPrompts: PromptDefinition[] = [
  {
    name: 'top_10_serp_organic',
    title: 'Top 10 SERP Organic Results',
    params: {
        keyword: z.string().describe('The keyword to search for'),
        location: z.string().describe('The location to search in')
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Show me the current top 10 organic results for '${params.keyword}' in the ${params.location} Google search`
            }
          }
        ]
      };
    }
  },
  {
    name: 'featured_snippets_and_people_also_ask',
    title: 'Featured Snippets and People Also Ask',
    params: {
        keyword: z.string().describe('The keyword to search for'),
        location: z.string().describe('The location to search in')
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Are there any featured snippets or People Also Ask boxes showing for '${params.keyword}' on ${params.location}?`
            }
          }
        ]
      };
    }
  },
  {
    name: 'top_5_serp_paid_and_organic',
    title: 'Top 5 SERP Paid and Organic',
    params: {
        keyword: z.string().describe('The keyword to search for'),
        location: z.string().describe('The location to search in')
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Retrieve the top 5 paid ads and organic listings for '${params.keyword}' on ${params.location}.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'top_3_google_result_domains',
    title: 'Top 3 Google Result Domains',
    params: {
        keyword: z.string().describe('The keyword to search for'),
        location: z.string().describe('The location to search in')
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `List the domains that consistently appear in the top 3 Google results for '${params.keyword}' over the past 7 days`
            }
          }
        ]
      };
    }
  },
  {
    name: 'current_top_ranking',
    title: 'Current Top Ranking',
    params: {
        keyword: z.string().describe('The keyword to search for'),
        location: z.string().describe('The location to search in')
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `What’s currently ranking #1 for '${params.keyword}' in ${params.location}?`
            }
          }
        ]
      };
    }
  },
]   