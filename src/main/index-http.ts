#!/usr/bin/env node
import { buildBasicAuthHeader } from '../core/client/dataforseo.client.js';
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request as ExpressRequest, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { name, version } from '../core/utils/version.js';
import { initializeFieldConfiguration } from '../core/config/field-configuration.js';
import { initMcpServer } from "./init-mcp-server.js";

// Initialize field configuration if provided
initializeFieldConfiguration();

// Extended request interface to include auth properties
interface Request extends ExpressRequest {
  authHeader?: string;
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

  // Auth middleware: passthrough Authorization header (Basic or Bearer) as-is,
  // or build a Basic header from env credentials as fallback.
  // Bearer tokens are issued by AUTH_SERVER_URL via OAuth (see /.well-known
  // endpoint below) and forwarded directly to DataForSEO without exchange.
  const authMiddleware = (req: Request, res: Response, next: NextFunction) => {

    // if (req.body?.method === 'tools/list') {
    //   next();
    //   return;
    // }

    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Basic ') || authHeader?.startsWith('Bearer ')) {
      req.authHeader = authHeader;
    } else if (process.env.DATAFORSEO_USERNAME && process.env.DATAFORSEO_PASSWORD) {
      // Fall back to environment variables if no header credentials provided
      req.authHeader = buildBasicAuthHeader(
        process.env.DATAFORSEO_USERNAME,
        process.env.DATAFORSEO_PASSWORD,
      );
    }

    // Validate credentials
    if (!req.authHeader) {
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

    next();
  };

  const handleMcpRequest = async (req: Request, res: Response) => {
    // In stateless mode, create a new instance of transport and server for each request
    // to ensure complete isolation. A single instance would cause request ID collisions
    // when multiple clients connect concurrently.

    try {
      const server = initMcpServer(req.authHeader!);
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

  // OAuth 2.0 Protected Resource discovery endpoint (RFC 9728).
  // MCP clients hit this on a 401 to find out which authorization server
  // issues Bearer tokens for this resource. Only exposed when the server
  // is not pre-configured with static credentials.
  if (!process.env.DATAFORSEO_USERNAME && !process.env.DATAFORSEO_PASSWORD) {
    app.get('/.well-known/oauth-protected-resource', (req, res) => {
      const resource = `${req.protocol}://${req.get('host')}`;
      res.json({ resource, authorization_servers: [AUTH_SERVER_URL] });
    });
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
