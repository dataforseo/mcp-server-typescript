import { z } from 'zod';
import { PromptDefinition } from '../prompt-definition.js';


export const onpagePrompts: PromptDefinition[] = [
  {
    name: 'dfs-crawlability-audit',
    title: 'Identify technical performance issues affecting crawlability and ranking',
    params: {
      url: z.string().describe('The URL of the page to analyze'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Audit page '${params.url}' for crawlability issues, including robots.txt restrictions, noindex tags, and broken internal links. Highlight what's preventing Google from indexing or ranking this page.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'dfs-meta-tags-check',
    title: 'Detect missing or duplicate meta tags hurting SEO',
    params: {
      url: z.string().describe('The URL of the page to analyze'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Review page '${params.url}' to check for missing or duplicate meta title and meta description tags, use validate_micromarkup, enable_javascript, and enable_browser_rendering. Let me know if the tags are too long, too short, or missing, and how to fix them.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'dfs-performance-mobile-check',
    title: 'Check for slow load time and mobile compatibility issues',
    params: {
      url: z.string().describe('The URL of the page to analyze'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Analyze page '${params.url}' for speed and mobile usability. Use load_resources, enable_javascript, and enable_browser_rendering. Tell me what's slowing it down or making it hard to use on mobile, include the measurements, and give practical steps to improve performance.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'dfs-internal-linking-audit',
    title: 'Evaluate internal linking and crawl depth for better indexing',
    params: {
      url: z.string().describe('The URL of the page to analyze'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Check how well '${params.url}' is connected internally. Use load_resources, enable_javascript, and enable_browser_rendering. Tell me if it's buried too deep in the site structure or lacks internal links that could help search engines find and rank it. Include the data for each issue or metric.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'dfs-keyword-content-gaps',
    title: 'Analyze keyword optimization and content gaps',
    params: {
      url: z.string().describe('The URL of the page to analyze'),
      keyword: z.string().describe('The primary keyword to optimize for'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Evaluate '${params.url}' for how well it's optimized for the keyword '${params.keyword}'. Analyze on-page SEO elements like title, meta description, headings (H1-H6), internal links, and keyword usage, extract and parse all content elements (headings, paragraphs, alt attributes, etc.), and check for keyword placement and semantic relevance. Identify missing keyword placements and content gaps that could affect its relevance and ranking.`
            }
          }
        ]
      };
    }
  },
]