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
import { GetPromptResult, isInitializeRequest, ReadResourceResult, ServerNotificationSchema } from "@modelcontextprotocol/sdk/types.js"
import { name, version } from '../core/utils/version.js';
import { ModuleLoaderService } from "../core/utils/module-loader.js";
import { initializeFieldConfiguration } from '../core/config/field-configuration.js';
import { initMcpServer } from "./init-mcp-server.js";

// Initialize field configuration if provided
initializeFieldConfiguration();

// Extended request interface to include auth properties
interface Request extends ExpressRequest {
  username?: string;
  password?: string;
}

console.error('Starting DataForSEO MCP Server...');
console.error(`Server name: ${name}, version: ${version}`);

function getSessionId() {
  return randomUUID().toString();
}

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL ?? 'http://localhost:8000';

async function main() {
  const app = express();
  app.use(express.json());

  // Basic Auth Middleware
  const basicAuth = async (req: Request, res: Response, next: NextFunction) => {

    // if (req.body?.method === 'tools/list') {
    //   next();
    //   return;
    // }

    const authHeader = req.headers.authorization;
    const envUsername = process.env.DATAFORSEO_USERNAME;
    const envPassword = process.env.DATAFORSEO_PASSWORD;

    let username: string | undefined;
    let password: string | undefined;

    // Try to extract credentials from Authorization header
    if (authHeader?.startsWith('Basic ')) {
      try {
        const base64Credentials = authHeader.slice(6);
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        [username, password] = credentials.split(':');
      } catch (error) {
        console.error('Invalid Basic auth header:', error);
      }
    }
    
    if (authHeader?.startsWith('Bearer ')) {
      const oauthToken = req.headers.authorization?.replace("Bearer ", "") ?? '';
      if (oauthToken) {
        const credentials = await exchangeOAuthToken(oauthToken);
        if (credentials) {
          [username, password] = credentials;
        }
      }
    }

    // Fall back to environment variables if no header credentials provided
    if (!username || !password) {
      username = envUsername;
      password = envPassword;
    }

    // Validate credentials
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

    req.username = username;
    req.password = password;
    next();
  };

  const handleMcpRequest = async (req: Request, res: Response) => {
    // In stateless mode, create a new instance of transport and server for each request
    // to ensure complete isolation. A single instance would cause request ID collisions
    // when multiple clients connect concurrently.
    
    try {      
      const server = initMcpServer(req.username, req.password); 
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
      console.error('Error handling MCP request:', error);
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
  };

  const handleNotAllowed = (method: string) => async (req: Request, res: Response) => {
    console.error(`Received ${method} request`);
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed."
      },
      id: null
    });
  };
  
  const apiTokenCache = new Map<string, { username: string, password: string }>();
  
  async function exchangeOAuthToken(oauthToken: string): Promise<string[] | null> {
    const cached = apiTokenCache.get(oauthToken);
    if (cached) return [cached.username, cached.password];
    
    try {
      const res = await fetch(`${AUTH_SERVER_URL}/api/mcp/token`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${oauthToken}` },
      });
      if (!res.ok) return null;
      const data = await res.json() as { login: string; password: string };
      const username = data.login || undefined;
      const password = data.password || undefined;
      if (username && password) {
        apiTokenCache.set(oauthToken, {username, password});
        return [username, password];
      }
      return null;
    } catch {
      return null;
    }
  }
  
  if (!process.env.username && !process.env.password) {
    app.get('/.well-known/oauth-protected-resource', (req, res) => {
      const resource = `${req.protocol}://${req.get('host')}`;
      res.json({ resource, authorization_servers: [AUTH_SERVER_URL] });
    });
  }

  // Apply basic auth and shared handler to both endpoints
  app.post('/http', basicAuth, handleMcpRequest);
  app.post('/mcp', basicAuth, handleMcpRequest);

  app.get('/http', handleNotAllowed('GET HTTP'));
  app.get('/mcp', handleNotAllowed('GET MCP'));

  app.delete('/http', handleNotAllowed('DELETE HTTP'));
  app.delete('/mcp', handleNotAllowed('DELETE MCP'));

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
