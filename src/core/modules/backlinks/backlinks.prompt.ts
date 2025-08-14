import { z } from 'zod';
import { PromptDefinition } from '../prompt-definition.js';


export const backlinksPrompts: PromptDefinition[] = [
  {
    name: 'reffering_domains',
    title: 'Backlinks Referring Domains',
    params: {
        site: z.string().describe('The site to find referring domains for'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Show the top 20 referring domains linking to ${params.site}, sorted by domain authority.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'anchors',
    title: 'Backlinks Anchors Text',
    params: {
        site: z.string().describe('The site to find anchor texts for'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `List all anchor texts used in backlinks pointing to ${params.site} and how often each appears.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'backlinks_profiles_comparison',
    title: 'Backlinks Compare 2 domains',
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
              text: `Compare the backlink profiles of ${params.site1} and ${params.site2} in terms of unique referring domains and total links`
            }
          }
        ]
      };
    }
  },
  {
    name: 'new_discovered_backlinks',
    title: 'New Backlinks Discovered For Site',
    params: {
        site: z.string().describe('The site to find new backlinks for'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Find all new backlinks discovered in the last 30 days for ${params.site}.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'broken_backlinks',
    title: 'Broken Backlinks For Site',
    params: {
        site: z.string().describe('The site to find broken backlinks for'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Get a list of broken backlinks pointing to ${params.site} so I can reclaim link equity`
            }
          }
        ]
      };
    }
  },
]