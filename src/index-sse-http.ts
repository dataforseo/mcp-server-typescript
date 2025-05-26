import express, {
    Request as ExpressRequest,
    Response,
    NextFunction,
} from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import {
    DataForSEOClient,
    DataForSEOConfig,
} from "./client/dataforseo.client.js";
import { SerpApiModule } from "./modules/serp/serp-api.module.js";
import { KeywordsDataApiModule } from "./modules/keywords-data/keywords-data-api.module.js";
import { OnPageApiModule } from "./modules/onpage/onpage-api.module.js";
import { DataForSEOLabsApi } from "./modules/dataforseo-labs/dataforseo-labs-api.module.js";
import {
    EnabledModulesSchema,
    isModuleEnabled,
} from "./config/modules.config.js";
import { BaseModule, ToolDefinition } from "./modules/base.module.js";
import { BacklinksApiModule } from "./modules/backlinks/backlinks-api.module.js";
import { BusinessDataApiModule } from "./modules/business-data-api/business-data-api.module.js";
import { DomainAnalyticsApiModule } from "./modules/domain-analytics/domain-analytics-api.module.js";
import { name, version } from "./utils/version.js";
import { InMemoryEventStore } from "@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js";

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
    username?: string;
    password?: string;
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
    Object.entries(transports).forEach(
        ([sessionId, { transport, lastActivity }]) => {
            if (now - lastActivity > CONNECTION_TIMEOUT) {
                console.log(
                    `Cleaning up stale connection for session ${sessionId}`
                );
                try {
                    transport.close();
                } catch (error) {
                    console.error(
                        `Error closing transport for session ${sessionId}:`,
                        error
                    );
                }
                delete transports[sessionId];
            }
        }
    );
}

// Start periodic cleanup
const cleanupInterval = setInterval(cleanupStaleConnections, CLEANUP_INTERVAL);

function getServer(
    username: string | undefined,
    password: string | undefined
): McpServer {
    const server = new McpServer(
        {
            name,
            version,
        },
        { capabilities: { logging: {} } }
    );

    // Initialize DataForSEO client
    const dataForSEOConfig: DataForSEOConfig = {
        username: username || "",
        password: password || "",
    };

    const dataForSEOClient = new DataForSEOClient(dataForSEOConfig);
    console.error("DataForSEO client initialized");

    // Parse enabled modules from environment
    const enabledModules = EnabledModulesSchema.parse(
        process.env.ENABLED_MODULES
    );

    // Initialize modules
    const modules: BaseModule[] = [];

    if (isModuleEnabled("SERP", enabledModules)) {
        modules.push(new SerpApiModule(dataForSEOClient));
    }
    if (isModuleEnabled("KEYWORDS_DATA", enabledModules)) {
        modules.push(new KeywordsDataApiModule(dataForSEOClient));
    }
    if (isModuleEnabled("ONPAGE", enabledModules)) {
        modules.push(new OnPageApiModule(dataForSEOClient));
    }
    if (isModuleEnabled("DATAFORSEO_LABS", enabledModules)) {
        modules.push(new DataForSEOLabsApi(dataForSEOClient));
    }
    if (isModuleEnabled("BACKLINKS", enabledModules)) {
        modules.push(new BacklinksApiModule(dataForSEOClient));
    }
    if (isModuleEnabled("BUSINESS_DATA", enabledModules)) {
        modules.push(new BusinessDataApiModule(dataForSEOClient));
    }
    if (isModuleEnabled("DOMAIN_ANALYTICS", enabledModules)) {
        modules.push(new DomainAnalyticsApiModule(dataForSEOClient));
    }

    // Register module tools
    modules.forEach((module) => {
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

    return server;
}

// Create Express application
const app = express();
app.use(express.json());

// Auth Middleware (supports both Basic and Bearer)
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        next();
        return;
    }

    if (authHeader.startsWith("Basic ")) {
        // Handle Basic Auth
        const base64Credentials = authHeader.split(" ")[1];
        const credentials = Buffer.from(base64Credentials, "base64").toString(
            "utf-8"
        );
        const [username, password] = credentials.split(":");

        if (!username || !password) {
            console.error("Invalid Basic auth credentials");
            res.status(401).json({
                jsonrpc: "2.0",
                error: {
                    code: -32001,
                    message: "Invalid credentials",
                },
                id: null,
            });
            return;
        }

        req.username = username;
        req.password = password;
        next();
    } else if (authHeader.startsWith("Bearer ")) {
        // Handle Bearer Token
        const token = authHeader.split(" ")[1];

        if (!token) {
            console.error("Invalid Bearer token");
            res.status(401).json({
                jsonrpc: "2.0",
                error: {
                    code: -32001,
                    message: "Invalid Bearer token",
                },
                id: null,
            });
            return;
        }

        // Decode Bearer token (expecting base64 encoded "username:password")
        try {
            const credentials = Buffer.from(token, "base64").toString("utf-8");
            const [username, password] = credentials.split(":");

            if (!username || !password) {
                console.error("Invalid Bearer token format");
                res.status(401).json({
                    jsonrpc: "2.0",
                    error: {
                        code: -32001,
                        message:
                            "Invalid Bearer token format. Expected base64 encoded 'username:password'",
                    },
                    id: null,
                });
                return;
            }

            req.username = username;
            req.password = password;
            next();
        } catch (error) {
            console.error("Error decoding Bearer token:", error);
            res.status(401).json({
                jsonrpc: "2.0",
                error: {
                    code: -32001,
                    message: "Invalid Bearer token encoding",
                },
                id: null,
            });
            return;
        }
    } else {
        next();
    }
};

//=============================================================================
// STREAMABLE HTTP TRANSPORT (PROTOCOL VERSION 2025-03-26)
//=============================================================================

app.all("/mcp", authMiddleware, async (req: Request, res: Response) => {
    console.log(`Received ${req.method} request to /mcp`);

    try {
        const sessionId = req.headers["mcp-session-id"] as string | undefined;
        let transport: StreamableHTTPServerTransport;

        // Handle credentials
        if (!req.username && !req.password) {
            const envUsername = process.env.DATAFORSEO_USERNAME;
            const envPassword = process.env.DATAFORSEO_PASSWORD;

            if (!envUsername || !envPassword) {
                res.status(401).json({
                    jsonrpc: "2.0",
                    error: {
                        code: -32001,
                        message:
                            "Authentication required. Provide DataForSEO credentials.",
                    },
                    id: null,
                });
                return;
            }
            req.username = envUsername;
            req.password = envPassword;
        }

        if (sessionId && transports[sessionId]) {
            const transportData = transports[sessionId];
            if (
                transportData.transport instanceof StreamableHTTPServerTransport
            ) {
                transport = transportData.transport;
                transportData.lastActivity = Date.now();
            } else {
                console.error(
                    "Session exists but uses a different transport protocol"
                );
                res.status(400).json({
                    jsonrpc: "2.0",
                    error: {
                        code: -32000,
                        message:
                            "Bad Request: Session exists but uses a different transport protocol",
                    },
                    id: null,
                });
                return;
            }
        } else if (
            !sessionId &&
            req.method === "POST" &&
            isInitializeRequest(req.body)
        ) {
            const eventStore = new InMemoryEventStore();
            transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                eventStore,
                onsessioninitialized: (sessionId: string) => {
                    console.log(
                        `StreamableHTTP session initialized with ID: ${sessionId}`
                    );
                    transports[sessionId] = {
                        transport,
                        lastActivity: Date.now(),
                    };
                },
            });

            const cleanup = () => {
                const sid = transport.sessionId;
                if (sid && transports[sid]) {
                    console.log(
                        `Transport closed for session ${sid}, removing from transports map`
                    );
                    try {
                        transport.close();
                    } catch (error) {
                        console.error(
                            `Error closing transport for session ${sid}:`,
                            error
                        );
                    }
                    delete transports[sid];
                }
            };

            transport.onclose = cleanup;
            req.socket.setTimeout(CONNECTION_TIMEOUT);
            req.socket.on("error", cleanup);
            req.socket.on("timeout", cleanup);
            req.on("error", cleanup);
            res.on("error", cleanup);
            res.on("close", cleanup);

            const server = getServer(req.username, req.password);
            await server.connect(transport);
        } else {
            console.error("No valid session ID provided");
            res.status(400).json({
                jsonrpc: "2.0",
                error: {
                    code: -32000,
                    message: "Bad Request: No valid session ID provided",
                },
                id: null,
            });
            return;
        }

        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        console.error("Error handling MCP request:", error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: "2.0",
                error: {
                    code: -32603,
                    message: "Internal server error",
                },
                id: null,
            });
        }
    }
});

// User-friendly documentation page
app.get("/docs", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html");
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DataForSEO MCP Server - Multi-User Guide</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .auth-example { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .endpoint { background: #e8f4f8; padding: 10px; border-radius: 5px; margin: 10px 0; }
        code { background: #f0f0f0; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🔌 DataForSEO MCP Server</h1>
    <p><strong>Multi-User Support Enabled</strong> - Each user provides their own DataForSEO credentials</p>
    
    <h2>🔐 How to Use with Your Own Credentials</h2>
    
    <h3>Step 1: Get Your DataForSEO Credentials</h3>
    <ol>
        <li>Sign up at <a href="https://dataforseo.com" target="_blank">DataForSEO.com</a></li>
        <li>Get your username and password from your account</li>
    </ol>
    
    <h3>Step 2: Create Your Auth Token</h3>
    <div class="auth-example">
        <h4>PowerShell (Windows):</h4>
        <pre>$credentials = "your_username:your_password"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($credentials)
$token = [System.Convert]::ToBase64String($bytes)
Write-Output $token</pre>
    </div>
    
    <div class="auth-example">
        <h4>Bash (Linux/Mac):</h4>
        <pre>echo -n "your_username:your_password" | base64</pre>
    </div>
    
    <h3>Step 3: Use with MCP Clients</h3>
    
    <h4>🤖 n8n MCP Client Configuration:</h4>
    <div class="endpoint">
        <strong>Transport Type:</strong> SSE<br>
        <strong>URL:</strong> <code>https://d4seo.mcp.wot-ai.com/sse</code><br>
        <strong>Auth Type:</strong> Bearer<br>
        <strong>Token:</strong> Your base64 token from Step 2
    </div>
    
    <h4>🔧 Claude Desktop Configuration:</h4>
    <pre>{
  "mcpServers": {
    "dataforseo": {
      "transport": {
        "type": "http",
        "url": "https://d4seo.mcp.wot-ai.com/mcp"
      },
      "auth": {
        "type": "bearer",
        "token": "YOUR_BASE64_TOKEN"
      }
    }
  }
}</pre>
    
    <h4>📡 Direct API Usage:</h4>
    <div class="endpoint">
        <strong>Validate Credentials:</strong><br>
        <code>POST /validate-credentials</code><br>
        <code>Authorization: Bearer YOUR_TOKEN</code>
    </div>
    
    <div class="endpoint">
        <strong>MCP Protocol:</strong><br>
        <code>POST /mcp</code><br>
        <code>Authorization: Bearer YOUR_TOKEN</code><br>
        <code>Content-Type: application/json</code>
    </div>
    
    <h2>🛡️ Security Features</h2>
    <ul>
        <li>✅ <strong>Credential Isolation:</strong> Each request uses only the provided credentials</li>
        <li>✅ <strong>No Storage:</strong> Credentials are never stored server-side</li>
        <li>✅ <strong>Per-Request Auth:</strong> Every API call requires valid credentials</li>
        <li>✅ <strong>Multiple Auth Methods:</strong> Bearer Token, Basic Auth, or Environment Variables</li>
    </ul>
    
    <h2>📋 Available Endpoints</h2>
    <ul>
        <li><code>GET /</code> - Health check</li>
        <li><code>GET /docs</code> - This documentation</li>
        <li><code>GET /api-docs</code> - JSON API documentation</li>
        <li><code>POST /validate-credentials</code> - Test your credentials</li>
        <li><code>GET /sse</code> - SSE MCP endpoint (for n8n)</li>
        <li><code>POST /mcp</code> - HTTP MCP endpoint (for Claude Desktop)</li>
    </ul>
    
    <h2>🔍 Test Your Setup</h2>
    <p>Use the credential validation endpoint to test your setup:</p>
    <div class="auth-example">
        <strong>curl example:</strong>
        <pre>curl -X POST https://d4seo.mcp.wot-ai.com/validate-credentials \\
  -H "Authorization: Bearer YOUR_BASE64_TOKEN"</pre>
    </div>
    
    <p><em>Server Version: ${version} | Multi-User Enabled ✅</em></p>
</body>
</html>
    `);
});

//=============================================================================
// API DOCUMENTATION AND VALIDATION ENDPOINTS
//=============================================================================

// API documentation endpoint
app.get("/api-docs", (req: Request, res: Response) => {
    res.status(200).json({
        service: "DataForSEO MCP Server",
        version: version,
        description: "Multi-user MCP server for DataForSEO API access",
        authentication: {
            methods: ["Bearer Token", "Basic Auth", "Environment Variables"],
            bearer_token: {
                format: "Authorization: Bearer <base64-encoded-username:password>",
                example: "Authorization: Bearer dXNlcm5hbWU6cGFzc3dvcmQ=",
                note: "Base64 encode your DataForSEO 'username:password'",
            },
            basic_auth: {
                format: "Authorization: Basic <base64-encoded-username:password>",
                example: "Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=",
                note: "Standard HTTP Basic authentication",
            },
            environment_variables: {
                note: "Server fallback if no auth header provided",
                variables: ["DATAFORSEO_USERNAME", "DATAFORSEO_PASSWORD"],
            },
        },
        endpoints: {
            mcp: {
                path: "/mcp",
                description: "Streamable HTTP MCP endpoint",
                methods: ["GET", "POST", "DELETE"],
                protocol: "MCP 2025-03-26",
            },
            sse: {
                path: "/sse",
                description: "Server-Sent Events MCP endpoint",
                methods: ["GET"],
                protocol: "MCP 2024-11-05",
            },
            messages: {
                path: "/messages",
                description: "Message handling for SSE transport",
                methods: ["POST"],
                protocol: "MCP 2024-11-05",
            },
        },
        usage: {
            n8n_configuration: {
                transport_type: "sse",
                url: "/sse",
                auth_type: "bearer",
                token_format: "base64(username:password)",
            },
            claude_desktop: {
                transport_type: "http",
                url: "/mcp",
                auth_header: "Authorization: Bearer <token>",
            },
        },
        multi_user_support: {
            enabled: true,
            description: "Each user provides their own DataForSEO credentials",
            isolation: "Per-request credential isolation",
            security: "Credentials are not stored server-side",
        },
    });
});

// Credential validation endpoint
app.post(
    "/validate-credentials",
    authMiddleware,
    async (req: Request, res: Response) => {
        try {
            // Check if credentials are provided
            if (!req.username && !req.password) {
                const envUsername = process.env.DATAFORSEO_USERNAME;
                const envPassword = process.env.DATAFORSEO_PASSWORD;

                if (!envUsername || !envPassword) {
                    res.status(401).json({
                        valid: false,
                        error: "No credentials provided",
                        message:
                            "Provide DataForSEO credentials via Authorization header",
                    });
                    return;
                }
                req.username = envUsername;
                req.password = envPassword;
            }

            // Create DataForSEO client to test credentials
            const dataForSEOConfig: DataForSEOConfig = {
                username: req.username || "",
                password: req.password || "",
            };

            const dataForSEOClient = new DataForSEOClient(dataForSEOConfig);

            // Make a simple API call to validate credentials
            try {
                // This is a minimal call to check if credentials work
                const response = await dataForSEOClient.makeRequest(
                    "/v3/serp/google/tasks_ready"
                );

                res.status(200).json({
                    valid: true,
                    message: "Credentials are valid",
                    username: req.username,
                    timestamp: new Date().toISOString(),
                });
            } catch (error: any) {
                console.error("Credential validation failed:", error);

                if (error.response?.status === 401) {
                    res.status(401).json({
                        valid: false,
                        error: "Invalid credentials",
                        message: "DataForSEO rejected the provided credentials",
                    });
                } else {
                    res.status(200).json({
                        valid: "unknown",
                        error: "Unable to validate credentials",
                        message:
                            "DataForSEO API request failed, but credentials might be valid",
                        details: error.message,
                    });
                }
            }
        } catch (error) {
            console.error("Error validating credentials:", error);
            res.status(500).json({
                valid: false,
                error: "Server error during validation",
                message:
                    "An internal error occurred while validating credentials",
            });
        }
    }
);

//=============================================================================
// HEALTH CHECK ENDPOINTS
//=============================================================================

// Health check endpoint
app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        status: "healthy",
        service: "DataForSEO MCP Server (SSE)",
        version: version,
        timestamp: new Date().toISOString(),
        endpoints: {
            sse: "/sse",
            messages: "/messages",
        },
    });
});

// Health check endpoint (alternative)
app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: "healthy",
        service: "DataForSEO MCP Server (SSE)",
        version: version,
        timestamp: new Date().toISOString(),
        endpoints: {
            sse: "/sse",
            messages: "/messages",
        },
    });
});

//=============================================================================
// DEPRECATED HTTP+SSE TRANSPORT (PROTOCOL VERSION 2024-11-05)
//=============================================================================

app.get("/sse", authMiddleware, async (req: Request, res: Response) => {
    console.log("Received GET request to /sse (deprecated SSE transport)");

    // Handle credentials
    if (!req.username && !req.password) {
        const envUsername = process.env.DATAFORSEO_USERNAME;
        const envPassword = process.env.DATAFORSEO_PASSWORD;

        if (!envUsername || !envPassword) {
            console.error("No DataForSEO credentials provided");
            res.status(401).json({
                jsonrpc: "2.0",
                error: {
                    code: -32001,
                    message:
                        "Authentication required. Provide DataForSEO credentials.",
                },
                id: null,
            });
            return;
        }
        req.username = envUsername;
        req.password = envPassword;
    }

    const transport = new SSEServerTransport("/messages", res);

    // Store transport with timestamp
    transports[transport.sessionId] = {
        transport,
        lastActivity: Date.now(),
    };

    // Handle connection cleanup
    const cleanup = () => {
        try {
            transport.close();
        } catch (error) {
            console.error(
                `Error closing transport for session ${transport.sessionId}:`,
                error
            );
        }
        delete transports[transport.sessionId];
    };

    // Add multiple event listeners for different scenarios
    res.on("close", cleanup);
    res.on("error", cleanup);
    req.on("error", cleanup);
    req.socket.on("error", cleanup);
    req.socket.on("timeout", cleanup);

    // Set socket timeout
    req.socket.setTimeout(CONNECTION_TIMEOUT);

    const server = getServer(req.username, req.password);
    await server.connect(transport);
});

app.post("/messages", authMiddleware, async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;

    // Handle credentials
    if (!req.username && !req.password) {
        const envUsername = process.env.DATAFORSEO_USERNAME;
        const envPassword = process.env.DATAFORSEO_PASSWORD;

        if (!envUsername || !envPassword) {
            res.status(401).json({
                jsonrpc: "2.0",
                error: {
                    code: -32001,
                    message:
                        "Authentication required. Provide DataForSEO credentials.",
                },
                id: null,
            });
            return;
        }
        req.username = envUsername;
        req.password = envPassword;
    }

    const transportData = transports[sessionId];
    if (!transportData) {
        res.status(400).send("No transport found for sessionId");
        return;
    }

    if (!(transportData.transport instanceof SSEServerTransport)) {
        res.status(400).json({
            jsonrpc: "2.0",
            error: {
                code: -32000,
                message:
                    "Bad Request: Session exists but uses a different transport protocol",
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
    console.log(
        `DataForSEO MCP Server with SSE compatibility listening on port ${PORT}`
    );
    console.log(`
==============================================
SUPPORTED TRANSPORT OPTIONS:

1. Streamable Http (Protocol version: 2025-03-26)
   Endpoint: /mcp
   Methods: GET, POST, DELETE
   Usage: 
     - Initialize with POST to /mcp
     - Establish SSE stream with GET to /mcp
     - Send requests with POST to /mcp
     - Terminate session with DELETE to /mcp

2. Http + SSE (Protocol version: 2024-11-05)
   Endpoints: /sse (GET) and /messages (POST)
   Usage:
     - Establish SSE stream with GET to /sse
     - Send requests with POST to /messages?sessionId=<id>
==============================================
`);
});

// Handle server shutdown
process.on("SIGINT", async () => {
    console.log("Shutting down server...");

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
            console.error(
                `Error closing transport for session ${sessionId}:`,
                error
            );
        }
    }
    console.log("Server shutdown complete");
    process.exit(0);
});
