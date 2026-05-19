import express, { Request as ExpressRequest, Response, NextFunction } from 'express';
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { buildBasicAuthHeader } from '../core/client/dataforseo.client.js';
import { name, version } from '../core/utils/version.js';
import { initializeFieldConfiguration } from '../core/config/field-configuration.js';
import { initMcpServer } from './init-mcp-server.js';
import { defaultGlobalToolConfig } from '../core/config/global.tool.js';
import { getTokenExpiration } from '../core/utils/auth.js';

// Initialize field configuration if provided
initializeFieldConfiguration();
console.error('Starting DataForSEO MCP Server...');
console.error(`Server name: ${name}, version: ${version}`);


const CLOCK_SKEW_MS = 10_000;
/**
 * This example server demonstrates backwards compatibility with both:
 * 1. The deprecated HTTP+SSE transport (protocol version 2024-11-05)
 * 2. The Streamable HTTP transport (protocol version 2025-03-26)
 * 
 * It maintains a single MCP server instance but exposes two transport options:
 * - /mcp: The new Streamable HTTP endpoint (supports GET/POST/DELETE)
 * - /sse: The deprecated SSE endpoint for older clients (GET to establish stream)
 * - /messages: The deprecated POST endpoint for older clients (POST to send messages)
 */

// Configuration constants
const CONNECTION_TIMEOUT = 30000; // 30 seconds
const CLEANUP_INTERVAL = 60000; // 1 minute

// Extended request interface to include auth properties
interface Request extends ExpressRequest {
  authHeader?: string;
}

// Transport interface with timestamp
interface TransportWithTimestamp {
  transport: StreamableHTTPServerTransport | SSEServerTransport;
  lastActivity: number;
}

// Store transports by session ID
const transports: Record<string, TransportWithTimestamp> = {};

// Cleanup function for stale connections
function cleanupStaleConnections() {
  const now = Date.now();
  Object.entries(transports).forEach(([sessionId, { transport, lastActivity }]) => {
    if (now - lastActivity > CONNECTION_TIMEOUT) {
      console.log(`Cleaning up stale connection for session ${sessionId}`);
      try {
        transport.close();
      } catch (error) {
        console.error(`Error closing transport for session ${sessionId}:`, error);
      }
      delete transports[sessionId];
    }
  });
}

// Start periodic cleanup
const cleanupInterval = setInterval(cleanupStaleConnections, CLEANUP_INTERVAL);



// Create Express application
const app = express();

const trustProxy = process.env.TRUST_PROXY
if (trustProxy == "true") {
  // Behind a reverse proxy / ingress that terminates TLS: trust X-Forwarded-*
  // so req.protocol reflects https and OAuth metadata URLs are correct.
  if (defaultGlobalToolConfig.debug) {
    console.log(`'trust proxy' enabled`)
  }
  app.set('trust proxy', true);
}
app.use(express.json());

// Auth middleware: passthrough Authorization header (Basic or Bearer) as-is,
// or build a Basic header from env credentials as fallback.
// Bearer tokens are issued by AUTH_SERVER_URL via OAuth (see /.well-known
// endpoint below) and forwarded directly to DataForSEO without exchange.
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {

  const resourceMetadataUrl = `${req.protocol}://${req.get('host')}/.well-known/oauth-protected-resource${req.path}`;
  const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Basic ')) {
      req.authHeader = authHeader;
    }
    else if (authHeader?.startsWith('Bearer ')) {
      const expirationDate = getTokenExpiration(authHeader);
      if (expirationDate && expirationDate.getTime() + CLOCK_SKEW_MS <= Date.now()) {
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
        error: "invalid auth",
        error_description: "invalid auth"
      });
      return;
    }

    next();
};

//=============================================================================
// STREAMABLE HTTP TRANSPORT (PROTOCOL VERSION 2025-03-26)
//=============================================================================

const handleMcpRequest = async (req: Request, res: Response) => {
    // In stateless mode, create a new instance of transport and server for each request
    // to ensure complete isolation. A single instance would cause request ID collisions
    // when multiple clients connect concurrently.
    
    try {
      const initStart = performance.now();
      const server = initMcpServer(req.authHeader!);

      if (defaultGlobalToolConfig.debug) {
        console.log(`MCP server initialized in ${(performance.now() - initStart).toFixed(1)}ms`)
      }

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
  // RFC 9728 well-known is formed by inserting the metadata segment before
  // the resource path, so an MCP endpoint at https://host/mcp is discovered
  // at https://host/.well-known/oauth-protected-resource/mcp. Serve both the
  // root and the path-scoped variants; the returned `resource` MUST be the
  // canonical URI the client actually connects to (incl. the endpoint path).
  const protectedResourceHandler = (resourcePath: string) => (req: Request, res: Response) => {
    const base = `${req.protocol}://${req.get('host')}`;
    const resource = resourcePath
      ? `${base}/${resourcePath}`
      : base;

    const payload = {
      resource,
      authorization_servers: [defaultGlobalToolConfig.authServer],
      bearer_methods_supported: ["header"],
    };

    if (defaultGlobalToolConfig.debug) {
      console.log(`.well-known/oauth-protected-resource resp payload: ${JSON.stringify(payload)}`)
    }
    res.json(payload);
  };

  app.get('/.well-known/oauth-protected-resource', protectedResourceHandler(''));
  app.get('/.well-known/oauth-protected-resource/mcp', protectedResourceHandler('mcp'));
  app.get('/.well-known/oauth-protected-resource/http', protectedResourceHandler('http'));
  app.get('/.well-known/oauth-protected-resource/sse', protectedResourceHandler('sse'));
  app.get('/.well-known/oauth-protected-resource/messages', protectedResourceHandler('messages'));
}

app.post('/http', authMiddleware, handleMcpRequest);
app.post('/mcp', authMiddleware, handleMcpRequest);

app.get('/http', handleNotAllowed('GET HTTP'));
app.get('/mcp', handleNotAllowed('GET MCP'));

app.delete('/http', handleNotAllowed('DELETE HTTP'));
app.delete('/mcp', handleNotAllowed('DELETE MCP'));

//=============================================================================
// DEPRECATED HTTP+SSE TRANSPORT (PROTOCOL VERSION 2024-11-05)
//=============================================================================

app.get('/sse', authMiddleware, async (req: Request, res: Response) => {
  console.log('Received GET request to /sse (deprecated SSE transport)');

  if (!req.authHeader) {
    console.error('No DataForSEO credentials provided');
    const resourceMetadataUrl = `${req.protocol}://${req.get('host')}/.well-known/oauth-protected-resource${req.path}`;
    res.setHeader(
      'WWW-Authenticate',
      `Bearer error="invalid_token", error_description="access token expired", resource_metadata="${resourceMetadataUrl}"`
    );
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

  const transport = new SSEServerTransport('/messages', res);
  
  // Store transport with timestamp
  transports[transport.sessionId] = {
    transport,
    lastActivity: Date.now()
  };

  // Handle connection cleanup
  const cleanup = () => {
    try {
      transport.close();
    } catch (error) {
      console.error(`Error closing transport for session ${transport.sessionId}:`, error);
    }
    delete transports[transport.sessionId];
  };

  res.on("error", cleanup);
  req.on("error", cleanup);
  req.socket.on("error", cleanup);
  req.socket.on("timeout", cleanup);

  // Set socket timeout
  req.socket.setTimeout(CONNECTION_TIMEOUT);

  const server = initMcpServer(req.authHeader);
  await server.connect(transport);
});

app.post("/messages", authMiddleware, async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const resourceMetadataUrl = `${req.protocol}://${req.get('host')}/.well-known/oauth-protected-resource${req.path}`;

  if (!req.authHeader) {
    res.setHeader(
      'WWW-Authenticate',
      `Bearer error="invalid_token", error_description="access token expired", resource_metadata="${resourceMetadataUrl}"`
    );
    res.status(401).json({
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message: "Authentication required"
      },
      id: null
    });
    return;
  }

  if (req.authHeader?.startsWith('Bearer ')) {
      const expirationDate = getTokenExpiration(req.authHeader);
      if (expirationDate && expirationDate.getTime() + CLOCK_SKEW_MS <= Date.now()) {
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
  }

  const transportData = transports[sessionId];
  if (!transportData) {
    res.status(400).send('No transport found for sessionId');
    return;
  }

  if (!(transportData.transport instanceof SSEServerTransport)) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: Session exists but uses a different transport protocol',
      },
      id: null,
    });
    return;
  }

  // Update last activity timestamp
  transportData.lastActivity = Date.now();
  
  await transportData.transport.handlePostMessage(req, res, req.body);
});

// Start the server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const server = app.listen(PORT, () => {
  console.log(`DataForSEO MCP Server with SSE compatibility listening on port ${PORT}`);
  console.log(`
==============================================
SUPPORTED TRANSPORT OPTIONS:

1. Streamable Http (Protocol version: 2025-03-26)
   Endpoint: /http (POST)
   Endpoint: /mcp (POST)


2. Http + SSE (Protocol version: 2024-11-05)
   Endpoints: /sse (GET) and /messages (POST)
   Usage:
     - Establish SSE stream with GET to /sse
     - Send requests with POST to /messages?sessionId=<id>
==============================================
`);
});

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  
  // Clear cleanup interval
  clearInterval(cleanupInterval);

  // Close HTTP server
  server.close();

  // Close all active transports
  for (const sessionId in transports) {
    try {
      console.log(`Closing transport for session ${sessionId}`);
      await transports[sessionId].transport.close();
      delete transports[sessionId];
    } catch (error) {
      console.error(`Error closing transport for session ${sessionId}:`, error);
    }
  }
  console.log('Server shutdown complete');
  process.exit(0);
});
