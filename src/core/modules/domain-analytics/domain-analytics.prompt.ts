import { z } from 'zod';
import { PromptDefinition } from '../prompt-definition.js';


export const domainAnalyticsPrompts: PromptDefinition[] = [
      {
    name: 'cms_analytics_tools',
    title: 'CMS Analytics Tools',
    params: {
        site: z.string().describe('The site to analyze')
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `What CMS and analytics tools are being used on ${params.site}`
            }
          }
        ]
      };
    }
  },
    {
    name: 'full_tech_stack_and_whois',
    title: 'Full Tech Stack and WHOIS Profile',
    params: {
        site: z.string().describe('The site to analyze')
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Give me a full tech stack and WHOIS profile for ${params.site}`
            }
          }
        ]
      };
    }
  },
    {
    name: 'other_domains_by_organization',
    title: 'Other Domains by Organization',
    params: {
        site: z.string().describe('The site to analyze')
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `What other domains are registered under the same organization as ${params.site}`
            }
          }
        ]
      };
    }
  },
    {
    name: 'subdomains_and_technologies',
    title: 'Subdomains and Technologies',
    params: {
        site: z.string().describe('The site to analyze')
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `List all subdomains associated with ${params.site} and what they’re running (CMS, JS libraries, etc.).`
            }
          }
        ]
      };
    }
  },
    {
    name: 'hosting_and_cdn',
    title: 'Hosting and CDN Provider',
    params: {
        site: z.string().describe('The site to analyze')
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Check if ${params.site} is hosted in the US and identify its CDN provider.`
            }
          }
        ]
      };
    }
  },
]