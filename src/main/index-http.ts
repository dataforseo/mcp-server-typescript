#!/usr/bin/env node
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request as ExpressRequest, Response, NextFunction } from "express";
import { name, version } from '../core/utils/version.js';
import { initializeFieldConfiguration } from '../core/config/field-configuration.js';
import { initMcpServer } from "./init-mcp-server.js";
import { buildBasicAuthHeader } from "../core/client/dataforseo.client.js";
import { getTokenExpiration } from "../core/utils/auth.js";
import { defaultGlobalToolConfig } from "../core/config/global.tool.js";

// Initialize field configuration if provided
initializeFieldConfiguration();

// Extended request interface to include auth properties
interface Request extends ExpressRequest {
  authHeader?: string;
}

console.error('Starting DataForSEO MCP Server...');
console.error(`Server name: ${name}, version: ${version}`);

const CLOCK_SKEW_MS = 60_000

async function main() {
  const app = express();
  app.use(express.json());

  // Auth middleware: passthrough Authorization header (Basic or Bearer) as-is,
  // or build a Basic header from env credentials as fallback.
  // Bearer tokens are issued by AUTH_SERVER_URL via OAuth (see /.well-known
  // endpoint below) and forwarded directly to DataForSEO without exchange.
  const authMiddleware = (req: Request, res: Response, next: NextFunction) => {

    const resourceMetadataUrl = `${req.protocol}://${req.get('host')}/.well-known/oauth-protected-resource`;
    // if (req.body?.method === 'tools/list') {
    //   next();
    //   return;
    // }

    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Basic ')) {
      req.authHeader = authHeader;
    } 
    else if (authHeader?.startsWith('Bearer ')) {
      const expirationDate = getTokenExpiration(authHeader);
      if (expirationDate && expirationDate.getTime() <= Date.now() - CLOCK_SKEW_MS) {
        if (defaultGlobalToolConfig.debug) {
          console.log('bearer token expired, return 401')
        }
        res.setHeader(
          'WWW-Authenticate',
          `Bearer error="invalid_token", error_description="access token expired", resource_metadata="${resourceMetadataUrl}"`
        );
        res.status(401).json({
          error: 'invalid_token',
          error_description: 'expired bearer token'
        });
        return;
      }

      if (defaultGlobalToolConfig.debug) {
        console.log('set bearer token')
      }

      req.authHeader = authHeader;
    }
    else if (process.env.DATAFORSEO_USERNAME && process.env.DATAFORSEO_PASSWORD) {
      // Fall back to environment variables if no header credentials provided
      req.authHeader = buildBasicAuthHeader(
        process.env.DATAFORSEO_USERNAME,
        process.env.DATAFORSEO_PASSWORD,
      );
    }

    // Validate credentials
    if (!req.authHeader) {
      res.setHeader(
        'WWW-Authenticate',
        `Bearer error="invalid_token", error_description="token is null or empty", resource_metadata="${resourceMetadataUrl}"`
      );

      res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: "Invalid auth"
        },
        id: null
      });
      return;
    }

    next();
  };

  const handleMcpRequest = async (req: Request, res: Response) => {
    // In stateless mode, create a new instance of transport and server for each request
    // to ensure complete isolation. A single instance would cause request ID collisions
    // when multiple clients connect concurrently.

    try {      
      const initStart = performance.now();
      const server = initMcpServer(req.authHeader!);
      console.log(`MCP server initialized in ${(performance.now() - initStart).toFixed(1)}ms`);

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

  // OAuth 2.0 Protected Resource discovery endpoint (RFC 9728).
  // MCP clients hit this on a 401 to find out which authorization server
  // issues Bearer tokens for this resource. Only exposed when the server
  // is not pre-configured with static credentials.
  if (!process.env.DATAFORSEO_USERNAME && !process.env.DATAFORSEO_PASSWORD) {
    app.get('/.well-known/oauth-protected-resource', (req, res) => {
      const resource = `${req.protocol}://${req.get('host')}`;
      let payload = { resource, authorization_servers: [defaultGlobalToolConfig.authServer] };

      if (defaultGlobalToolConfig.debug) {
        console.log(`.well-known/oauth-protected-resource resp payload: ${JSON.stringify(payload)}`)
      }
      res.json(payload);
    });

    app.get('/.well-known/oauth-authorization-server', (req, res) => {
      const resource = `${req.protocol}://${req.get('host')}`;
      let payload = {
        issuer: resource,
        authorization_endpoint: `${defaultGlobalToolConfig.authServer}/authorize`,
        token_endpoint: `${defaultGlobalToolConfig.authServer}/token`,
        registration_endpoint: `${defaultGlobalToolConfig.authServer}/register`,
      };
      if (defaultGlobalToolConfig.debug) {
        console.log(`.well-known/oauth-authorization-server resp payload: ${JSON.stringify(payload)}`)
      }
      res.json(payload)
    })
  }

  // Apply auth middleware and shared handler to both endpoints
  app.post('/http', authMiddleware, handleMcpRequest);
  app.post('/mcp', authMiddleware, handleMcpRequest);

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
