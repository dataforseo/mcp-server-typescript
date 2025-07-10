import { z } from 'zod';
import { DataForSEOClient } from '../../../../client/dataforseo.client.js';
import { BaseTool, DataForSEOResponse } from '../../../base.tool.js';

export class BusinessDataBusinessListingsSearchTool extends BaseTool {
  constructor(private client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'business_data_business_listings_search';
  }

  getDescription(): string {
    return `Business Listings Search API provides results containing information about business entities listed on Google Maps in the specified categories. You will receive the address, contacts, rating, working hours, and other relevant data`;
  }

  getParams(): z.ZodRawShape {
    return {
      description: z.string().optional().describe(`description of the element in SERP
optional field
the description of the business entity for which the results are collected;
can contain up to 200 characters`),
      title: z.string().optional().describe(`title of the element in SERP
optional field
the name of the business entity for which the results are collected;
can contain up to 200 characters`),
      categories: z.array(z.string()).optional().describe(`business categories
the categories you specify are used to search for business listings;
if you don’t use this field, we will return business listings found in the specified location;
you can specify up to 10 categories`),
      location_coordinate: z.string().optional().describe(`GPS coordinates of a location
optional field
location_coordinate parameter should be specified in the “latitude,longitude,radius” format
the maximum number of decimal digits for “latitude” and “longitude”: 7
the value of “radius” is specified in kilometres (km)
the minimum value for “radius”: 1
the maximum value for “radius”: 100000
example:
53.476225,-2.243572,200`),
      limit: z.number().min(1).max(1000).default(10).optional().describe("the maximum number of returned businesses"),
      offset: z.number().min(0).optional().describe(
        `offset in the results array of returned businesses
optional field
default value: 0
if you specify the 10 value, the first ten entities in the results array will be omitted and the data will be provided for the successive entities`
      ),
      filters: z.array(
        z.union([
          z.array(z.union([z.string(), z.number(), z.boolean()])).length(3),
          z.enum(["and", "or"])
        ])
      ).max(8).optional().describe(
        `array of results filtering parameters
optional field
you can add several filters at once (8 filters maximum)
you should set a logical operator and, or between the conditions
the following operators are supported:
regex, not_regex, <, <=, >, >=, =, <>, in, not_in, like, not_like, match, not_match
you can use the % operator with like and not_like to match any string of zero or more characters
example:
["rating.value",">",3]`
      ),
      order_by: z.array(z.string()).optional().describe(
        `results sorting rules
optional field
you can use the same values as in the filters array to sort the results
possible sorting types:
asc – results will be sorted in the ascending order
desc – results will be sorted in the descending order
you should use a comma to set up a sorting parameter
example:
["rating.value,desc"]note that you can set no more than three sorting rules in a single request
you should use a comma to separate several sorting rules
example:
["rating.value,desc","rating.votes_count,desc"]`
      ),
      is_claimed: z.boolean().optional().describe(`indicates whether the business is verified by its owner on Google Maps`).default(true)
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.client.makeRequest('/v3/business_data/business_listings/search/live', 'POST', [{
        description: params.description,
        title: params.title,
        categories: params.categories,
        limit: params.limit,
        offset: params.offset,
        filters: this.formatFilters(params.filters),
        order_by: this.formatOrderBy(params.order_by),
        location_coordinate: params.location_coordinate
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 