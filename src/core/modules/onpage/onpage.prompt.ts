import { z } from 'zod';
import { PromptDefinition } from '../prompt-definition.js';


export const onpagePrompts: PromptDefinition[] = [
  {
    name: 'site_audit',
    title: 'On-page SEO audit of site',
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
              text: `Run a full on-page SEO audit for ${params.site} and summarize meta tag issues, missing headings, and performance warnings`
            }
          }
        ]
      };
    }
  },
  {
    name: 'site_broken_links',
    title: 'Search Internal and External Broken Links',
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
              text: `Find all internal and external broken links on ${params.site}/about-us`
            }
          }
        ]
      };
    }
  },
  {
    name: 'site_structured_data',
    title: 'Search Structured Data Types',
    description: '',
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
              text: `What structured data types are implemented on ${params.site}/our-data`
            }
          }
        ]
      };
    }
  },
  {
    name: 'site_mobile_usability',
    title: 'Evaluate Mobile Usability and Core Web Vitals',
    description: '',
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
              text: `Evaluate the mobile usability and Core Web Vitals for ${params.site}`
            }
          }
        ]
      };
    }
  },
  {
    name: 'site_mobile_usability',
    title: 'Evaluate Mobile Usability and Core Web Vitals',
    description: '',
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
              text: `Summarize the SEO performance of ${params.site} including traffic-driving keywords, backlink strength, and top-performing pages`
            }
          }
        ]
      };
    }
  },
]