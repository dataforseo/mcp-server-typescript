# DataForSEO MCP Server

Model Context Protocol (MCP) server implementation for DataForSEO, enabling Claude to interact with selected DataForSEO APIs and obtain SEO data through a standardized interface. 

## Features

- SERP API: real-time Search Engine Results Page (SERP) data for Google, Bing, and Yahoo;
- KEYWORDS_DATA API: keyword research and clickstream data, including search volume, cost-per-click, and other metrics;   
- ONPAGE API: allows crawling websites and webpages according to customizable parameters to obtain on-page SEO performance metrics; 
- DATAFORSEO_LABS API: data on keywords, SERPs, and domains based on DataForSEO's in-house databases and proprietary algorithms.

## Prerequisites

- Node.js (v14 or higher)
- DataForSEO API credentials (API login and password)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/dataforseo/mcp-server-typescript
cd mcp-server-typescript
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Required
export DATAFORSEO_USERNAME=your_username
export DATAFORSEO_PASSWORD=your_password

# Optional: specify which modules to enable (comma-separated)
# If not set, all modules will be enabled
export ENABLED_MODULES="SERP,KEYWORDS_DATA,ONPAGE,DATAFORSEO_LABS,BACKLINKS,BUSINESS_DATA,DOMAIN_ANALYTICS"

# Optional: enable full API responses
# If not set or set to false, the server will filter and transform API responses to a more concise format
# If set to true, the server will return the full, unmodified API responses
export DATAFORSEO_FULL_RESPONSE="false"
```

## Installation as an NPM Package

You can install the package globally:

```bash
npm install -g dataforseo-mcp-server
```

Or run it directly without installation:

```bash
npx dataforseo-mcp-server
```

Remember to set environment variables before running the command:

```bash
# Required environment variables
export DATAFORSEO_USERNAME=your_username
export DATAFORSEO_PASSWORD=your_password

# Run with npx
npx dataforseo-mcp-server
```

## Building and Running

Build the project:
```bash
npm run build
```

Run the server:
```bash
# Start local server (direct MCP communication)
npx dataforseo-mcp-server

# Start HTTP server
npx dataforseo-mcp-server http
```

## HTTP Server Configuration

The server runs on port 3000 by default and supports both Basic Authentication and environment variable-based authentication.

To start the HTTP server, run:
```bash
npm run http
```

### Authentication Methods

1. **Basic Authentication**
   - Send requests with Basic Auth header:
   ```
   Authorization: Basic <base64-encoded-credentials>
   ```
   - Credentials format: `username:password`

2. **Environment Variables**
   - If no Basic Auth is provided, the server will use credentials from environment variables:
   ```bash
   export DATAFORSEO_USERNAME=your_username
   export DATAFORSEO_PASSWORD=your_password
   ```
   
## Available Modules

The following modules are available to be enabled/disabled:

- `SERP`: real-time SERP data for Google, Bing, and Yahoo;
- `KEYWORDS_DATA`: keyword research and clickstream data;
- `ONPAGE`: crawl websites and webpages to obtain on-page SEO performance metrics;
- `DATAFORSEO_LABS`: data on keywords, SERPs, and domains based on DataForSEO's databases and algorithms;
- `BACKLINKS`: data on inbound links, referring domains and referring pages for any domain, subdomain, or webpage;
- `BUSINESS_DATA`: based on business reviews and business information publicly shared on the following platforms: Google, Trustpilot, Tripadvisor;
- `DOMAIN_ANALYTICS`: helps identify all possible technologies used for building websites and offers Whois data;
- `CONTENT_ANALYSIS`: help you discover citations of the target keyword or brand and analyze the sentiments around it;

## Adding New Tools/Modules

### Module Structure

Each module corresponds to a specific DataForSEO API:
- `SERP` module → [SERP API](https://docs.dataforseo.com/v3/serp/overview)
- `KEYWORDS_DATA` module → [Keywords Data API](https://docs.dataforseo.com/v3/keywords_data/overview)
- `ONPAGE` module → [OnPage API](https://docs.dataforseo.com/v3/on_page/overview)
- `DATAFORSEO_LABS` module → [DataForSEO Labs API](https://docs.dataforseo.com/v3/dataforseo_labs/overview)
- `BACKLINKS`: module → [Backlinks API](https://docs.dataforseo.com/v3/backlinks/overview)
- `BUSINESS_DATA`: module → [Business Data API](https://docs.dataforseo.com/v3/business_data/overview)
- `DOMAIN_ANALYTICS`: module → [Domain Analytics API](https://docs.dataforseo.com/v3/domain_analytics/overview)
- `CONTENT_ANALYSIS`: module → [Content Analysis API](https://docs.dataforseo.com/v3/content_analysis/overview)

### Implementation Options

You can either:
1. Add a new tool to an existing module
2. Create a completely new module

### Adding a New Tool

Here's how to add a new tool to any new or pre-existing module:

```typescript
// src/modules/your-module/tools/your-tool.tool.ts
import { BaseTool } from '../../base.tool';
import { DataForSEOClient } from '../../../client/dataforseo.client';
import { z } from 'zod';

export class YourTool extends BaseTool {
  constructor(private client: DataForSEOClient) {
    super(client);
    // DataForSEO API returns extensive data with many fields, which can be overwhelming
    // for AI agents to process. We select only the most relevant fields to ensure
    // efficient and focused responses.
    this.fields = [
      'title',           // Example: Include the title field
      'description',     // Example: Include the description field
      'url',            // Example: Include the URL field
      // Add more fields as needed
    ];
  }

  getName() {
    return 'your-tool-name';
  }

  getDescription() {
    return 'Description of what your tool does';
  }

  getParams(): z.ZodRawShape {
    return {
      // Required parameters
      keyword: z.string().describe('The keyword to search for'),
      location: z.string().describe('Location in format "City,Region,Country" or just "Country"'),
      
      // Optional parameters
      fields: z.array(z.string()).optional().describe('Specific fields to return in the response. If not specified, all fields will be returned'),
      language: z.string().optional().describe('Language code (e.g., "en")'),
    };
  }

  async handle(params: any) {
    try {
      // Make the API call
      const response = await this.client.makeRequest({
        endpoint: '/v3/dataforseo_endpoint_path',
        method: 'POST',
        body: [{
          // Your request parameters
          keyword: params.keyword,
          location: params.location,
          language: params.language,
        }],
      });

      // Validate the response for errors
      this.validateResponse(response);

      //if the main data array is specified in tasks[0].result[:] field
      const result = this.handleDirectResult(response);
      //if main data array specified in tasks[0].result[0].items field
      const result = this.handleItemsResult(response);
      // Format and return the response
      return this.formatResponse(result);
    } catch (error) {
      // Handle and format any errors
      return this.formatErrorResponse(error);
    }
  }
}
```

### Creating a New Module

1. Create a new directory under `src/modules/` for your module:
```bash
mkdir -p src/modules/your-module-name
```

2. Create module files:
```typescript
// src/modules/your-module-name/your-module-name.module.ts
import { BaseModule } from '../base.module';
import { DataForSEOClient } from '../../client/dataforseo.client';
import { YourTool } from './tools/your-tool.tool';

export class YourModuleNameModule extends BaseModule {
  constructor(private client: DataForSEOClient) {
    super();
  }

  getTools() {
    return {
      'your-tool-name': new YourTool(this.client),
    };
  }
}
```

3. Register your module in `src/config/modules.config.ts`:
```typescript
export const AVAILABLE_MODULES = [
  'SERP',
  'KEYWORDS_DATA',
  'ONPAGE',
  'DATAFORSEO_LABS',
  'BACKLINKS',
  'BUSINESS_DATA',
  'DOMAIN_ANALYTICS',
  'CONTENT_ANALYSIS',
  'YOUR_MODULE_NAME'  // Add your module name here
] as const;
```

4. Initialize your module in `src/index.ts`:
```typescript
if (isModuleEnabled('YOUR_MODULE_NAME', enabledModules)) {
  modules.push(new YourModuleNameModule(dataForSEOClient));
}
```

## Field Configuration

The MCP server supports field filtering to customize which data fields are returned in API responses. This helps reduce response size and focus on the most relevant data for your use case.

### Configuration File Format

Create a JSON configuration file with the following structure:

```json
{
  "supported_fields": {
    "tool_name": ["field1", "field2", "field3"],
    "another_tool": ["field1", "field2"]
  }
}
```

### Using Field Configuration

Pass the configuration file using the `--configuration` parameter:

```bash
# With npm
npm run cli -- http --configuration field-config.json

# With npx
npx dataforseo-mcp-server http --configuration field-config.json

# Local mode
npx dataforseo-mcp-server local --configuration field-config.json
```

### Configuration Behavior

- **If a tool is configured**: Only the specified fields will be returned in the response
- **If a tool is not configured**: All available fields will be returned (default behavior)
- **If no configuration file is provided**: All tools return all available fields

### Example Configuration File

The repository includes an example configuration file `field-config.example.json` with optimized field selections for common tools:

```json
{
  "supported_fields": {
    "backlinks_backlinks": [
      "id",
      "items.anchor",
      "items.backlink_spam_score",
      "items.dofollow",
      "items.domain_from",
      "items.domain_from_country",
      "items.domain_from_ip",
      "items.domain_from_platform_type",
      "items.domain_from_rank",
      "items.domain_to",
      "items.first_seen",
      "items.is_broken",
      "items.is_new",
      "items.item_type",
      "items.last_seen",
      "items.links_count",
      "items.original",
      "items.page_from_encoding",
      "items.page_from_external_links",
      "items.page_from_internal_links",
      "items.page_from_language",
      "items.page_from_rank",
      "items.page_from_size",
      "items.page_from_status_code",
      "items.page_from_title",
      "items.prev_seen",
      "items.rank",
      "items.ranked_keywords_info.page_from_keywords_count_top_10",
      "items.ranked_keywords_info.page_from_keywords_count_top_100",
      "items.ranked_keywords_info.page_from_keywords_count_top_3",
      "items.semantic_location",
      "items.text_post",
      "items.text_pre",
      "items.tld_from",
      "items.type",
      "items.url_from",
      "items.url_from_https",
      "items.url_to",
      "items.url_to_https",
      "items.url_to_spam_score",
      "items.url_to_status_code",
      "status_code",
      "status_message"
    ],
    ...
  }
}
```

### Nested Field Support

The configuration supports nested field paths using dot notation:

- `"rating.value"` - Access the `value` field within the `rating` object
- `"items.demography.age.keyword"` - Access deeply nested fields
- `"meta.description"` - Access nested object properties

### Field Discovery

To discover available fields for any tool:

1. Run the tool without field configuration to see the full response
2. Identify the fields you need from the API response
3. Add those field paths to your configuration file

### Creating Your Own Configuration

1. Copy the example file:
```bash
cp field-config.example.json my-config.json
```

2. Modify the field selections based on your needs

3. Use your custom configuration:
```bash
npx dataforseo-mcp-server http --configuration my-config.json
```

## What endpoints/APIs do you want us to support next?

We're always looking to expand the capabilities of this MCP server. If you have specific DataForSEO endpoints or APIs you'd like to see supported, please:

1. Check the [DataForSEO API Documentation](https://docs.dataforseo.com/v3/) to see what's available
2. Open an issue in our GitHub repository with:
   - The API/endpoint you'd like to see supported;
   - A brief description of your use case;
   - Describe any specific features you'd like to see implemented.

Your feedback helps us prioritize which APIs to support next!

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/quickstart)
- [DataForSEO API Documentation](https://docs.dataforseo.com/)