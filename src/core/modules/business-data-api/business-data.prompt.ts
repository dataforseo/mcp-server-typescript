import { z } from 'zod';
import { PromptDefinition } from '../prompt-definition.js';


export const businessDataPrompts: PromptDefinition[] = [
  {
    name: 'businesses_rating',
    title: 'Listings Business Rating',
    params: {
        business_type: z.string().describe('The kind of business to find'),
        location: z.string().describe('The location to find law firms in'),
        min_rating: z.number().min(0).describe('The minimum average rating to filter law firms by'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Find ${params.business_type} businesses in ${params.location} with over 100 Google reviews and an average rating of ${params.min_rating} or higher`
            }
          }
        ]
      };
    }
  },
  {
    name: 'businesses_details',
    title: 'Business Data Listings In Location',
    params: {
        business_type: z.string().describe('The type of business to find'),
        location: z.string().describe('The location to find businesses in'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Get business listing details (name, website, phone, rating) for ${params.business_type} in ${params.location}`
            }
          }
        ]
      };
    }
  },
  {
    name: 'new_businesses',
    title: 'New Businesses',
    params: {
        location: z.string().describe('The location to find new businesses in'),
        business_type: z.string().describe('The type of business to find'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `List new ${params.business_type} that opened in ${params.location} in the past 30 days`
            }
          }
        ]
      };
    }
  },
  {
    name: 'top_businesses',
    title: 'Top Businesses',
    params: {
        location: z.string().describe('The location to find top businesses in'),
        business_type: z.string().describe('The type of business to find'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Compare review trends for top 5 ${params.business_type} in ${params.location} with their star ratings and total reviews.`
            }
          }
        ]
      };
    }
  },
  {
    name: 'businesses_without_profiles',
    title: 'Businesses Without Profiles',
    params: {
        business_type: z.string().describe('The type of business to find'),
        location: z.string().describe('The location to find businesses in'),
    },
    handler: async (params) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Show me ${params.business_type} businesses in ${params.location} that have websites but no claimed Google Business Profile.`
            }
          }
        ]
      };
    }
  },
]