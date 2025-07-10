#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DataForSEOClient, DataForSEOConfig } from '../core/client/dataforseo.client.js';
import { SerpApiModule } from '../core/modules/serp/serp-api.module.js';
import { KeywordsDataApiModule } from '../core/modules/keywords-data/keywords-data-api.module.js';
import { OnPageApiModule } from '../core/modules/onpage/onpage-api.module.js';
import { DataForSEOLabsApi } from '../core/modules/dataforseo-labs/dataforseo-labs-api.module.js';
import { EnabledModulesSchema, isModuleEnabled, defaultEnabledModules } from '../core/config/modules.config.js';
import { BaseModule, ToolDefinition } from '../core/modules/base.module.js';
import { z } from 'zod';
import { BacklinksApiModule } from "../core/modules/backlinks/backlinks-api.module.js";
import { BusinessDataApiModule } from "../core/modules/business-data-api/business-data-api.module.js";
import { DomainAnalyticsApiModule } from "../core/modules/domain-analytics/domain-analytics-api.module.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request as ExpressRequest, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { GetPromptResult, isInitializeRequest, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js"
import { name, version } from '../core/utils/version.js';
import { ModuleLoaderService } from "../core/utils/module-loader.js";
import { initializeFieldConfiguration } from '../core/config/field-configuration.js';

// Initialize field configuration if provided
initializeFieldConfiguration();

// Extended request interface to include auth properties
interface Request extends ExpressRequest {
  username?: string;
  password?: string;
}

console.error('Starting DataForSEO MCP Server...');
console.error(`Server name: ${name}, version: ${version}`);

function getServer(username: string | undefined, password: string | undefined) : McpServer
{
  const server = new McpServer({
    name,
    version,
  },{ capabilities: { logging: {}} });
  // Initialize DataForSEO client
  const dataForSEOConfig: DataForSEOConfig = {
    username: username || "",
    password: password || "",
  };
  
  const dataForSEOClient = new DataForSEOClient(dataForSEOConfig);
  console.error('DataForSEO client initialized');
  
  // Parse enabled modules from environment
  const enabledModules = EnabledModulesSchema.parse(process.env.ENABLED_MODULES);
  
  // Initialize modules
  const modules: BaseModule[] = ModuleLoaderService.loadModules(dataForSEOClient, enabledModules);
  
  console.error('Modules initialized');
  function registerModuleTools() {
    console.error('Registering tools');
    console.error(modules.length);
    modules.forEach(module => {
      const tools = module.getTools();
      Object.entries(tools).forEach(([name, tool]) => {
        const typedTool = tool as ToolDefinition;
        const schema = z.object(typedTool.params);
        server.tool(
          name,
          typedTool.description,
          schema.shape,
          typedTool.handler
        );
      });
    });
  }
  registerModuleTools();
  console.error('Tools registered');
  return server;
}

function getSessionId() {
  return randomUUID().toString();
}

async function main() {
  const app = express();
  app.use(express.json());

  // Basic Auth Middleware
  const basicAuth = (req: Request, res: Response, next: NextFunction) => {
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    console.error(authHeader)
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      next();
      return;
    }

    // Extract credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    if (!username || !password) {
      console.error('Invalid credentials');
      res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32001, 
          message: "Invalid credentials"
        },
        id: null
      });
      return;
    }

    // Add credentials to request
    req.username = username;
    req.password = password;
    next();
  };

  // Apply basic auth to MCP endpoint
  app.post('/http', basicAuth, async (req: Request, res: Response) => {
    // In stateless mode, create a new instance of transport and server for each request
    // to ensure complete isolation. A single instance would cause request ID collisions
    // when multiple clients connect concurrently.
    
    try {
      console.error(Date.now().toLocaleString())
      
      // Check if we have valid credentials
      if (!req.username && !req.password) {
        // If no request auth, check environment variables
      const envUsername = process.env.DATAFORSEO_USERNAME;
      const envPassword = process.env.DATAFORSEO_PASSWORD;
        if (!envUsername || !envPassword) {
          console.error('No DataForSEO credentials provided');
          res.status(401).json({
            jsonrpc: "2.0",
            error: {
              code: -32001,
              message: "Authentication required. Provide DataForSEO credentials."
            },
            id: null
          });
          return;
        }
        // Use environment variables
        req.username = envUsername;
        req.password = envPassword;
      }
      
      const server = getServer(req.username, req.password); 
      console.error(Date.now().toLocaleString())

      const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined
      });

      await server.connect(transport);
      console.error('handle request');
      await transport.handleRequest(req , res, req.body);
      console.error('end handle request');
      req.on('close', () => {
        console.error('Request closed');
        transport.close();
        server.close();
      });

    } catch (error) {
      console.error('Error handling HTTP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });

  app.get('/http', async (req: Request, res: Response) => {
    console.error('Received GET HTTP request');
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed."
      },
      id: null
    });
  });

  app.delete('/http', async (req: Request, res: Response) => {
    console.error('Received DELETE HTTP request');
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed."
      },
      id: null
    });
  });

  // Start the server
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(PORT, () => {
    console.log(`MCP Stateless Streamable HTTP Server listening on port ${PORT}`);
  });
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
