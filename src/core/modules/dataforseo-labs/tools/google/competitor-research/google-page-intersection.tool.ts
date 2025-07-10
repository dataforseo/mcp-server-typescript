import { z } from 'zod';
import { DataForSEOClient } from '../../../../../client/dataforseo.client.js';
import { BaseTool } from '../../../../base.tool.js';
import { mapArrayToNumberedKeys } from '../../../../../utils/map-array-to-numbered-keys.js';

export class GooglePageIntersectionsTool extends BaseTool {
  constructor(private client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'dataforseo_labs_google_page_intersection';
  }

  getDescription(): string {
    return `This endpoint will provide you with the keywords for which specified pages rank within the same SERP. You will get search volume, competition, cost-per-click and impressions data on each intersecting keyword. Along with that, you will get data on SERP elements that specified pages rank for in search results, as well as the estimated traffic volume and cost of ad traffic. Page Intersection endpoint supports organic, paid, local pack and featured snippet results.

Find keywords several webpages rank for:
If you would like to get the keywords several pages rank for, you need to specify webpages only in the pages object. This way, you will receive intersected ranked keywords for the specified URLs.

Find keywords your competitors rank for but you do not:
If you would like to receive all keywords several pages rank for, but particular pages do not, you need to use the exclude_pages array as well. This way you will receive the keywords for which the URLs from the pages object rank for, but the URLs from the exclude_pages array do not`;
  }

  getParams(): z.ZodRawShape {
    return {
      pages: z.array(z.string()).describe(`pages array
required field
you can set up to 20 pages in this object
the pages should be specified with absolute URLs (including http:// or https://)
if you specify a single page here, we will return results only for this page;
you can also use a wildcard ('*') character to specify the search pattern
example:
"example.com"
search for the exact URL
"example.com/eng/*"
search for the example.com page and all its related URLs which start with '/eng/', such as "example.com/eng/index.html" and "example.com/eng/help/", etc.
note: a wilcard should be placed after the slash ('/') character in the end of the URL, it is not possible to place it after the domain in the following way:
https://dataforseo.com*
use https://dataforseo.com/* instead`),
      exclude_pages: z.array(z.string()).optional().describe(`URLs of pages you want to exclude
optional field
you can set up to 10 pages in this array
if you use this array, results will contain the keywords for which URLs from the pages object rank, but URLs from exclude_pages array do not;
note that if you specify this field, the results will be based on the keywords any URL from pages ranks for regardless of intersections between them. However, you can set intersection_mode to intersect and results will contain the keywords all URLs from pages rank for in the same SERP and URLs from exclude_pages do not.
use a wildcard (‘*’) character to specify the search pattern
example:
"exclude_pages": [
"https://www.apple.com/iphone/*",
"https://dataforseo.com/apis/*",
"https://www.microsoft.com/en-us/industry/services/"
]`),
       intersection_mode: z.enum(['union', 'intersect']).optional().describe(`indicates whether to intersect keywords
optional field
use this field to intersect or merge results for the specified URLs
possible values: union, intersect

union – results are based on all keywords any URL from pages rank for;

intersect – results are based on the keywords all URLs from pages rank for in the same SERP:

by default, results are based on the intersect mode if you specify only pages array. If you specify exclude_pages as well, results are based on the union mode`),
      location_name: z.string().default("United States").describe(`full name of the location
required field
in format "Country"
example:
United Kingdom`),
      language_code: z.string().default("en").describe(
        `language code
        required field
        example:
        en`),
      ignore_synonyms: z.boolean().default(true).describe(
          `ignore highly similar keywords, if set to true, results will be more accurate`),
      limit: z.number().min(1).max(1000).default(10).optional().describe("Maximum number of keywords to return"),
      offset: z.number().min(0).optional().describe(
        `offset in the results array of returned keywords
        optional field
        default value: 0
        if you specify the 10 value, the first ten keywords in the results array will be omitted and the data will be provided for the successive keywords`
      ),
      filters: z.array(
        z.union([
          z.array(z.union([z.string(), z.number(), z.boolean()])).length(3),
          z.enum(["and", "or"])
        ])
      ).max(8).optional().describe(
        `you can add several filters at once (8 filters maximum)
        you should set a logical operator and, or between the conditions
        the following operators are supported:
        regex, not_regex, <, <=, >, >=, =, <>, in, not_in, match, not_match, ilike, not_ilike, like, not_like
        you can use the % operator with like and not_like, as well as ilike and not_ilike to match any string of zero or more characters
        merge operator must be a string and connect two other arrays, availible values: or, and.
        example:
        ["keyword_data.keyword_info.search_volume","in",[100,1000]]
        [["intersection_result.1.etv",">",0],"and",["intersection_result.2.description","like","%goat%"]]
        [["keyword_data.keyword_info.search_volume",">",100],"and",[["intersection_result.1.description","like","%goat%"],"or",["intersection_result.2.type","=","organic"]]]`
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
["keyword_data.keyword_info.competition,desc"]
default rule:
["keyword_data.keyword_info.search_volume,desc"]
note that you can set no more than three sorting rules in a single request
you should use a comma to separate several sorting rules
example:
["intersection_result.1.rank_group,asc","intersection_result.2.rank_absolute,asc"]`
      ),      
      include_clickstream_data: z.boolean().optional().default(false).describe(
        `Include or exclude data from clickstream-based metrics in the result`)
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.client.makeRequest('/v3/dataforseo_labs/google/page_intersection/live', 'POST', [{
        pages: mapArrayToNumberedKeys(params.pages),
        location_name: params.location_name,
        language_code: params.language_code,
        ignore_synonyms: params.ignore_synonyms,
        filters: this.formatFilters(params.filters),
        order_by: this.formatOrderBy(params.order_by),
        exclude_top_domains: params.exclude_top_domains,
        item_types: ['organic'],
        exclude_pages: params.exclude_pages,
        intersection_mode: params.intersection_mode,
        limit: params.limit,
        offset: params.offset,
        include_clickstream_data: params.include_clickstream_data
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 