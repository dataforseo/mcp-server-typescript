import { z } from 'zod';
import { PromptDefinition } from '../prompt-definition.js';


export const serpPrompts: PromptDefinition[] = [
  {
    name: 'analyze_local_seo_differences_in_the_top_10_google_results_for_two_target_markets',
    title: 'Analyze local SEO differences in the top 10 Google results for two target markets.',
    params: {
      keyword: z.string().describe('The keyword to analyze'),
      language: z.string().describe('The language of the search results'),
      location1: z.string().describe('The first location to analyze'),
      location2: z.string().describe('The second location to analyze'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Use the serp_organic_live_advanced API to fetch the top 10 results and SERP features for the keyword '${params.keyword}' in '${params.language}' for two locations with two separate API requests: '${params.location1}', then in '${params.location2}'. Display a unified table of the top 10 results for both locations side-by-side, with columns: Rank, Domain, Title, Snippet (shorten), URL, and Element Type (e.g., Organic, Knowledge Graph, Featured Snippet, etc.).`
            }
          }
        ]
      };
    }
  },
  {
    name: 'monitor_visibility_for_key_branded_searches_in_real_time',
    title: 'Monitor visibility for key branded searches in real-time.',
    params: {
      domain: z.string().describe('The domain to monitor'),
      location: z.string().describe('The location to monitor'),
      language: z.string().describe('The language to monitor'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Using the real-time SERP API, check if '${params.domain}' currently ranks in the top 3 organic results or SERP features like featured snippet or knowledge graph for the branded keyword [keyword] in '${params.location}' in '${params.language}'. Indicate what competitors are showing in SERP features too if my domain is not featured.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'generate_domain_visibility_reports_and_track_ranking_changes',
    title: 'Generate domain visibility reports and track ranking changes.',
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
              text: `Generate a domain visibility snapshot for '${params.domain}' in '${params.location}' in '${params.language}' using google_domain_rank_overview. List the estimated organic traffic, percentage of top 10 rankings, and SERP position breakdown for this week. Compare to last month's values using google_historical_rank_overview.`
            }
          }
        ]
      };
    }
  },
]   
