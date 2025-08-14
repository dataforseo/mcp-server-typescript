import { join } from 'path';
import { z } from 'zod';
import { PromptDefinition } from '../prompt-definition.js';


export const datalabsPrompts: PromptDefinition[] = [
  {
    name: 'search_related_keywords',
    title: 'Search Related Keywords Prompt',
    params: {
      keyword: z.string().describe('The main keyword to search related keywords for'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Find long-tail keywords related to '${params.keyword}' with low competition and at least 1,000 monthly searches in the US.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'keywords_suggestion',
    title: 'Suggest Keywords for around AI content prompt',
    params: {
      keyword: z.string().describe('The main keyword to suggest related keywords for'),
      location: z.string().describe('The location to filter keywords by'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Give me a list of question-based keywords people are searching for around '${params.keyword}' in the ${params.location}.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'keyword_overview_comparisons',
    title: 'Keyword Overview Comparisons',
    params: {
      keywords: z.string().describe('The keywords to compare'),
      location: z.string().describe('The location to filter keywords by'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Compare keyword difficulty and CPC for ${params.keywords} in ${params.location}.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'related_keywords_by_intent',
    title: 'Keyword Cluster Related Keywords by Intent',
    params: {
      keyword: z.string().describe('The main keyword to cluster related keywords for'),
      intents: z.string().describe('The intents must be: informational, navigational, transactional, commercial'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Cluster keywords related to '${params.keyword}' by intent: ${params.intents}.`
            }
          }
        ]
      };
    }
  },
    {
    name: 'compare_sites_by_keywords',
    title: 'Competitor Comparison',
    params: {
      site1: z.string().describe('The first site to compare'),
      site2: z.string().describe('The second site to compare'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Create a competitor comparison matrix between ${params.site1} and ${params.site2} based on keyword overlap and backlink profile.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'find_competing_domains',
    title: 'Find Competing Domains',
    params: {
      site: z.string().describe('The site to find competing domains for'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Find domains competing for the same top 10 keywords as ${params.site}.`
            }
          }
        ]
      };
    }
  },
];