# DataForSEO MCP Server

Model Context Protocol (MCP) server implementation for DataForSEO, enabling AI assistants to interact with selected DataForSEO APIs and obtain SEO data through a standardized interface. 

## Features

- **AI_OPTIMIZATION API**: provides data for keyword discovery, conversational optimization, and real-time LLM benchmarking; 
- **SERP API**: real-time Search Engine Results Page (SERP) data for Google, Bing, and Yahoo;
- **KEYWORDS_DATA API**: keyword research and clickstream data, including search volume, cost-per-click, and other metrics;   
- **ONPAGE API**: allows crawling websites and webpages according to customizable parameters to obtain on-page SEO performance metrics; 
- **DATAFORSEO LABS API**: data on keywords, SERPs, and domains based on DataForSEO's in-house databases and proprietary algorithms;
- **BACKLINKS API**: comprehensive backlink analysis including referring domains, anchor text distribution, and link quality metrics;
- **BUSINESS DATA API**: publicly available data on any business entity;
- **DOMAIN ANALYTICS API**: data on website traffic, technologies, and Whois details;
- **CONTENT ANALYSIS API**: robust source of data for brand monitoring, sentiment analysis, and citation management;
- **MERCHANT API**: provides essential data and metrics for comprehensive competitor analysis, price monitoring, and market research across Google Shopping, Amazon etc.

## Custom SERP Tools (this fork)

This fork adds two SERP tools on top of the upstream server, both focused on returning lean, AI-friendly JSON instead of the full (often enormous) DataForSEO payload. Both live in the `SERP` module.

### `serp_organic_task_bulk` — bulk SERPs via the task queue

Fetches Google/Bing/Yahoo organic results for **many keywords at once** using DataForSEO's task-queue pattern. The upstream server only offers the *live* endpoint (one keyword per call, billed at the higher live rate); this tool batches keywords as standard-priority tasks, which is cheaper and scales.

It runs the whole queue loop internally so a single tool call returns everything:

1. **Post** — submits all keywords in one `task_post` batch (up to 100), tagging each with its index so results map back even if keywords repeat.
2. **Poll** — polls each task id via `task_get/advanced/{id}` on an interval, watching the queue status codes (`40602` in-queue / `40601` in-progress → keep waiting; `20000` → done).
3. **Strip** — trims each completed result to organic listings plus an AI Overview signal.

**Parameters**

| Param | Type | Default | Notes |
|---|---|---|---|
| `keywords` | `string[]` | — | **Required.** 1–100 keywords. |
| `language_code` | `string` | — | **Required.** e.g. `"en"`. |
| `search_engine` | `string` | `"google"` | `google`, `bing`, or `yahoo`. |
| `location_name` | `string` | `"United States"` | Hierarchical, e.g. `"San Francisco,California,United States"`. |
| `depth` | `number` | `10` | Number of organic results (10–700). |
| `device` | `string` | `"desktop"` | `desktop` or `mobile`. |
| `priority` | `number` | `1` | `1` = normal (cheaper, slower), `2` = high. |
| `include_ai_overview` | `boolean` | `true` | Requests AI Overview loading so cited URLs are returned. |
| `max_wait_seconds` | `number` | `180` | Max time to poll before returning partial results (10–600). |
| `poll_interval_seconds` | `number` | `6` | Delay between polling rounds (2–60). |

**Response shape** — a summary plus one compact object per keyword:

```jsonc
{
  "keywords_requested": 3,
  "completed": 3,
  "pending": 0,
  "errored": 0,
  "results": [
    {
      "keyword": "best running shoes",
      "location_name": "United States",
      "language_code": "en",
      "status": "ok",                 // ok | pending | error
      "organic": [
        { "rank": 1, "title": "...", "url": "...", "domain": "...", "description": "..." }
      ],
      "ai_overview": {
        "exists": true,
        "cited_urls": ["https://...", "https://..."]   // citations only, no overview text
      }
    }
  ]
}
```

Anything still in the queue when `max_wait_seconds` elapses comes back with `status: "pending"` and a message — the call never hangs, and you can re-run to re-poll. For large batches, raise `max_wait_seconds` or set `priority: 2`.

**Example prompt**

> Use `serp_organic_task_bulk` to pull Google organic results for: "best running shoes", "marathon training plan", "trail running tips". Location "United States", language "en". Flag any keyword with an AI Overview and its cited URLs.

### `serp_organic_live_advanced-content` — live SERP, noise stripped

Same as the upstream `serp_organic_live_advanced` (one keyword, live endpoint) but recursively strips item types that are rarely useful for content analysis before formatting — currently `product_considerations_element`, `popular_products`, and `perspectives` — which meaningfully shrinks the returned JSON. It also sets `group_organic_results: true`.

Use this for a single keyword when you want results immediately; use `serp_organic_task_bulk` for multiple keywords where queue latency is acceptable.

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

# Optional: specify which prompts in enabled modules are enable too (prompts names, comma-separated)
# If not set, all prompts from enabled modules will be enabled
export ENABLED_PROMPTS="top_3_google_result_domains,top_5_serp_paid_and_organic"

# Optional: enable full API responses
# If not set or set to false, the server will filter and transform API responses to a more concise format
# If set to true, the server will return the full, unmodified API responses
export DATAFORSEO_FULL_RESPONSE="false"

# Optional: enable simple filter schema
# If set to true, a simplified version of the filters schema will be used.
# This is required for ChatGPT APIs or other LLMs that cannot handle nested structures.
export DATAFORSEO_SIMPLE_FILTER="false"
```

## Installation as an NPM Package

You can install the package globally:

```bash
npm install -g dataforseo-mcp-server@latest
```

Or run it directly without installation:

```bash
npx dataforseo-mcp-server@latest
```

Remember to set environment variables before running the command:

```bash
# Required environment variables
export DATAFORSEO_USERNAME=your_username
export DATAFORSEO_PASSWORD=your_password

# Run with npx
npx dataforseo-mcp-server@latest
```

## Building and Running

Build the project:
```bash
npm run build
```

Run the server:
```bash
# Start local server (direct MCP communication)
npx dataforseo-mcp-server@latest

# Start HTTP server
npx dataforseo-mcp-server@latest http
```

## Installing into Claude (local dev build)

Use this when you want to run **your local fork** (including the custom SERP tools above) inside Claude rather than the published npm package. It runs over stdio against the compiled `build/main/main/index.js`.

### 1. Build it

```bash
git clone <your-fork-url> dataforseo_MCP_AI_Friendly
cd dataforseo_MCP_AI_Friendly
npm install
npm run build
```

This produces `build/main/main/index.js`. Note the **absolute path** to it — you'll need it below:

```bash
echo "$(pwd)/build/main/main/index.js"
```

### 2a. Claude Desktop

Edit Claude Desktop's MCP config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add a server entry pointing `node` at your local build (create the file / `mcpServers` object if it doesn't exist):

```json
{
  "mcpServers": {
    "dataforseo": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/dataforseo_MCP_AI_Friendly/build/main/main/index.js"],
      "env": {
        "DATAFORSEO_USERNAME": "your_username",
        "DATAFORSEO_PASSWORD": "your_password",
        "ENABLED_MODULES": "SERP"
      }
    }
  }
}
```

Fully quit and reopen Claude Desktop. The tools appear under the 🔌 / tools menu; you should see `serp_organic_task_bulk` and `serp_organic_live_advanced-content` in the list.

### 2b. Claude Code (CLI)

Register the same local build with one command:

```bash
claude mcp add dataforseo \
  --env DATAFORSEO_USERNAME=your_username \
  --env DATAFORSEO_PASSWORD=your_password \
  --env ENABLED_MODULES=SERP \
  -- node "/ABSOLUTE/PATH/TO/dataforseo_MCP_AI_Friendly/build/main/main/index.js"
```

Then verify it connected:

```bash
claude mcp list
```

### Notes

- **Rebuild after changes.** Stdio launches the compiled JS, so re-run `npm run build` (or `npm run dev` to watch) and restart Claude / the session after editing source.
- **Scope it down.** `ENABLED_MODULES=SERP` loads only the SERP tools; drop it to expose every module.
- **Leave `DATAFORSEO_FULL_RESPONSE` unset/`false`** so responses stay trimmed — the custom tools do their own stripping regardless, but other tools rely on this for concise output.

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
   # Optional
   export DATAFORSEO_SIMPLE_FILTER="false"
   export DATAFORSEO_FULL_RESPONSE="true"
   ```

## Cloudflare Worker Deployment

The DataForSEO MCP Server can be deployed as a Cloudflare Worker for serverless, edge-distributed access to DataForSEO APIs.

### Worker Features

- **Edge Distribution**: Deploy globally across Cloudflare's edge network
- **Serverless**: No server management required
- **Auto-scaling**: Handles traffic spikes automatically
- **MCP Protocol Support**: Compatible with both Streamable HTTP and SSE transports
- **Environment Variables**: Secure credential management through Cloudflare dashboard

### Quick Start

1. **Install Wrangler CLI**:
   ```bash
   npm install -g wrangler
   ```

2. **Configure Worker**:
   ```bash
   # Login to Cloudflare
   wrangler login
   
   # Set environment variables
   wrangler secret put DATAFORSEO_USERNAME
   wrangler secret put DATAFORSEO_PASSWORD
   ```

3. **Deploy Worker**:
   ```bash
   # Build and deploy
   npm run build
   wrangler deploy --main build/index-worker.js
   ```

### Configuration

The worker uses the same environment variables as the standard server:

- `DATAFORSEO_USERNAME`: Your DataForSEO username
- `DATAFORSEO_PASSWORD`: Your DataForSEO password  
- `ENABLED_MODULES`: Comma-separated list of modules to enable
- `ENABLED_PROMPTS`: Comma-separated list of prompt names to enable 
- `DATAFORSEO_FULL_RESPONSE`: Set to "true" for full API responses

### Worker Endpoints

Once deployed, your worker will be available at `https://your-worker.your-subdomain.workers.dev/` with the following endpoints:

- **POST /mcp**: Streamable HTTP transport (recommended)
- **GET /sse**: SSE connection establishment (deprecated)
- **POST /messages**: SSE message handling (deprecated)
- **GET /health**: Health check endpoint
- **GET /**: API documentation page

### Advanced Configuration

Edit `wrangler.jsonc` to customize your deployment:

```jsonc
{
  "name": "dataforseo-mcp-worker",
  "main": "build/index-worker.js",
  "compatibility_date": "2025-07-10",
  "compatibility_flags": ["nodejs_compat"],
  "vars": {
    "ENABLED_MODULES": "SERP,KEYWORDS_DATA,ONPAGE,DATAFORSEO_LABS",
    "ENABLED_PROMPTS":"top_3_google_result_domains,top_5_serp_paid_and_organic"
  }
}
```

### Usage with Claude

After deployment, configure Claude to use your worker:

```json
{
  "name": "DataForSEO",
  "description": "Access DataForSEO APIs via Cloudflare Worker",
  "transport": {
    "type": "http",
    "baseUrl": "https://your-worker.your-subdomain.workers.dev/mcp"
  }
}
```
   
## Available Modules

The following modules are available to be enabled/disabled:

- `AI_OPTIMIZATION`: provides data for keyword discovery, conversational optimization, and real-time LLM benchmarking;
- `SERP`: real-time SERP data for Google, Bing, and Yahoo;
- `KEYWORDS_DATA`: keyword research and clickstream data;
- `ONPAGE`: crawl websites and webpages to obtain on-page SEO performance metrics;
- `DATAFORSEO_LABS`: data on keywords, SERPs, and domains based on DataForSEO's databases and algorithms;
- `BACKLINKS`: data on inbound links, referring domains and referring pages for any domain, subdomain, or webpage;
- `BUSINESS_DATA`: based on business reviews and business information publicly shared on the following platforms: Google, Trustpilot, Tripadvisor;
- `DOMAIN_ANALYTICS`: helps identify all possible technologies used for building websites and offers Whois data;
- `CONTENT_ANALYSIS`: help you discover citations of the target keyword or brand and analyze the sentiments around it;
- `MERCHANT`: helps retrieve product data, prices, and seller information from Google Shopping and Amazon etc.;

## Adding New Tools/Modules

### Module Structure

Each module corresponds to a specific DataForSEO API:
- `AI_OPTIMIZATION`: [AI Optimization API](https://docs.dataforseo.com/v3/ai_optimization/overview)
- `SERP` module → [SERP API](https://docs.dataforseo.com/v3/serp/overview)
- `KEYWORDS_DATA` module → [Keywords Data API](https://docs.dataforseo.com/v3/keywords_data/overview)
- `ONPAGE` module → [OnPage API](https://docs.dataforseo.com/v3/on_page/overview)
- `DATAFORSEO_LABS` module → [DataForSEO Labs API](https://docs.dataforseo.com/v3/dataforseo_labs/overview)
- `BACKLINKS`: module → [Backlinks API](https://docs.dataforseo.com/v3/backlinks/overview)
- `BUSINESS_DATA`: module → [Business Data API](https://docs.dataforseo.com/v3/business_data/overview)
- `DOMAIN_ANALYTICS`: module → [Domain Analytics API](https://docs.dataforseo.com/v3/domain_analytics/overview)
- `CONTENT_ANALYSIS`: module → [Content Analysis API](https://docs.dataforseo.com/v3/content_analysis/overview)
- `MERCHANT`: module -> [Metchant API](https://docs.dataforseo.com/v3/merchant/overview)

### Implementation Options

You can either:
1. Add a new tool to an existing module
2. Create a completely new module

### Adding a New Tool

Here's how to add a new tool to any new or pre-existing module:

```typescript
// src/code/modules/your-module/tools/your-tool.tool.ts
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

1. Create a new directory under `src/core/modules/` for your module:
```bash
mkdir -p src/core/modules/your-module-name
```

2. Create module files:
```typescript
// src/core/modules/your-module-name/your-module-name.module.ts
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

3. Register your module in `src/core/config/modules.config.ts`:
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

4. Initialize your module in `src/main/index.ts`:
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
npx dataforseo-mcp-server@latest http --configuration field-config.json

# Local mode
npx dataforseo-mcp-server@latest local --configuration field-config.json
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
npx dataforseo-mcp-server@latest http --configuration my-config.json
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
