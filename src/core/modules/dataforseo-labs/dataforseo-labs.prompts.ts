import { join } from 'path';
import { z } from 'zod';
import { PromptDefinition } from '../prompt-definition.js';


export const datalabsPrompts: PromptDefinition[] = [
  {
    name: 'dfs-decision-stage-content',
    title: 'Create content targeting decision-stage users',
    params: {
      product: z.string().describe('The product to search related keywords for')
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `What are alternative or comparison ("vs", "alternative", "best", "compare") search queries people use for ${params.product}? Return 20 ideas with high search volume.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'dfs-article-ideas-generator',
    title: 'Generate SEO-friendly article ideas that directly answer user questions.',
    params: {
      topic: z.string().describe('topic'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Show me 20 question-based keywords (what, why, how) for '${params.topic}' with search volume ≥ 300. Include search intent and suggest article headlines that match the query tone.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'dfs-high-intent-keywords',
    title: 'Focus on high-converting terms for paid campaigns based on buyer readiness.',
    params: {
      product: z.string().describe('The product/service to compare'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Find 20 commercial and transactional keywords related to '${params.product}'. Filter by CPC ≥ $2 and search volume ≥ 1,000. Suggest landing page angles based on intent.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'dfs-keyword-cluster-structure',
    title: 'Structure site content and internal linking based on keyword clusters.',
    params: {
      keyword: z.string().describe('The keyword to cluster related keywords for'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Provide a 20-term keyword cluster around ${params.keyword}. Group them by intent (informational, commercial, transactional) and list keyword difficulty and SERP features.`
            }
          }
        ]
      };
    }
  },
    {
    name: 'dfs-site-keyword-comparison',
    title: 'Competitor Comparison',
    params: {
      site_1: z.string().describe('The first site to compare'),
      site_2: z.string().describe('The second site to compare'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Create a competitor comparison matrix between ${params.site_1} and ${params.site_2} based on keyword overlap and backlink profile.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'dfs-user-intent-content',
    title: 'Build content that aligns with user research behavior and ranks easier.',
    params: {
      topic: z.string().describe('keyword/topic'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Give me 20 informational keywords around '${params.topic}' with low competition and moderate search volume (≥500). Group them by intent and suggest blog topics for each..`
            }
          }
        ]
      };
    }
  },
  {
    name: 'dfs-seo-performance-tracker',
    title: 'Track long-term SEO performance, visibility shifts, and seasonal trends.',
    params: {
      domain: z.string().describe('The domain to analyze'),
      location: z.string().describe('The location to analyze'),
      language: z.string().describe('The language to analyze'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Using google_historical_rank_overview in DataForSEO Labs API, show how the visibility and SERP position distribution of '${params.domain}' changed in ${params.location} in ${params.language} over the past 12 months. Focus on the top 3, top 10, and top 100 rankings, and highlight any traffic peaks.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'dfs-traffic-ranking-comparison',
    title: 'Compare monthly organic traffic trends and ranking distribution against a competitor.',
    params: {
      domain: z.string().describe('Your domain to analyze'),
      competitor_domain: z.string().describe('Competitor domain to compare against'),
      location: z.string().describe('The location to analyze'),
      language: z.string().describe('The language to analyze'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Compare the monthly organic traffic trends and ranking distribution of ${params.domain} vs ${params.competitor_domain} in ${params.location} in ${params.language} using google_domain_rank_overview. Highlight who has better top 10 visibility and estimated traffic this month.`
            }
          }
        ]
      };
    }
  },
];
