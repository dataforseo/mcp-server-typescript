import { z } from 'zod';
import { PromptDefinition } from '../prompt-definition.js';


export const backlinksPrompts: PromptDefinition[] = [
  {
    name: 'discover_your_strongest_backlinks_for_authority_building',
    title: 'Discover your strongest backlinks for authority building.',
    params: {
        domain: z.string().describe('The domain to find for'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Identify the top 10 highest-authority backlinks to '${params.domain}', grouped by referring domain. Include backlink type, anchor text, and target page.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'see_which_blog_content_earns_you_the_most_backlinks',
    title: 'See which blog content earns you the most backlinks.',
    params: {
      domain: z.string().describe('The domain to analyze'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content:{
              type: 'text',
              text: `Show me which blog posts on '${params.domain}' attract the most backlinks. List the top 5 by backlink count, and include title, referring domains, and anchor types.`
            }
          }
        ]
      }
    }
  },
  {
    name: 'find_new_link_opportunities_from_competitor_backlinks',
    title: 'Find new link opportunities from competitor backlinks.',
    params: {
      my_domain: z.string().describe('Your domain to compare against competitors'),
      competitor_1: z.string().describe('First competitor domain'),
      competitor_2: z.string().describe('Second competitor domain'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content:{
              type: 'text',
              text: `Which websites link to my competitors but not to '${params.my_domain}'? Use '${params.competitor_1}' and '${params.competitor_2}'. Return 15 domains I should target for outreach.`
            }
          }
        ]
      }
    }
  },
  {
    name: 'locate_broken_or_redirected_pages_that_waste_valuable_links',
    title: 'Locate broken or redirected pages that waste valuable links.',
    params: {
      domain: z.string().describe('The domain to analyze'),
      backlinks_count: z.number().default(30).describe('Minimum number of backlinks to consider a page valuable'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content:{
              type: 'text',
              text: `Find internal pages on '${params.domain}' that have over ${params.backlinks_count} backlinks but are 404 or redirected. Return URL, status code, backlink count, and top referring domains.`
            }
          }
        ]
      }
    }
  },
  {
    name: 'benchmark_backlink_gaps_between_you_and_a_competitor',
    title: 'Benchmark backlink gaps between you and a competitor.',
    params: {
      my_domain: z.string().describe('Your domain to compare against a competitor'),
      competitor: z.string().describe('Competitor domain to analyze'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content:{
              type: 'text',
              text: `Compare backlinks between '${params.my_domain}' and competitor '${params.competitor}'. Show 10 domains linking only to the competitor domain. Include domain authority and link count.`
            }
          }
        ]
      }
    }
  }
]
