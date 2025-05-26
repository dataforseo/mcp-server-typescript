#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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
    defaultEnabledModules,
} from "./config/modules.config.js";
import { BaseModule, ToolDefinition } from "./modules/base.module.js";
import { z } from "zod";
import { BacklinksApiModule } from "./modules/backlinks/backlinks-api.module.js";
import { BusinessDataApiModule } from "./modules/business-data-api/business-data-api.module.js";
import { DomainAnalyticsApiModule } from "./modules/domain-analytics/domain-analytics-api.module.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, {
    Request as ExpressRequest,
    Response,
    NextFunction,
} from "express";
import { randomUUID } from "node:crypto";
import {
    GetPromptResult,
    isInitializeRequest,
    ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import { name, version } from "./utils/version.js";

// Extended request interface to include auth properties
interface Request extends ExpressRequest {
    username?: string;
    password?: string;
}

console.error("Starting DataForSEO MCP Server...");

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
    // Register a simple prompt
    server.prompt(
        "greeting-template",
        "A simple greeting prompt template",
        {
            name: z.string().describe("Name to include in greeting"),
        },
        async ({ name }): Promise<any> => {
            return {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: `Please greet ${name} in a friendly manner.`,
                        },
                    },
                ],
            };
        }
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
    console.error("Modules initialized");
    function registerModuleTools() {
        console.error("Registering tools");
        console.error(modules.length);
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
    }
    registerModuleTools();
    console.error("Tools registered");
    server.resource(
        "greeting-resource",
        "https://example.com/greetings/default",
        { mimeType: "text/plain" },
        async (): Promise<ReadResourceResult> => {
            return {
                contents: [
                    {
                        uri: "https://example.com/greetings/default",
                        text: "Hello, world!",
                    },
                ],
            };
        }
    );
    return server;
}

function getSessionId() {
    return randomUUID().toString();
}

async function main() {
    const app = express();
    app.use(express.json()); // Auth Middleware (supports both Basic and Bearer)
    const authMiddleware = (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const authHeader = req.headers.authorization;
        console.error(authHeader);

        if (!authHeader) {
            next();
            return;
        }

        if (authHeader.startsWith("Basic ")) {
            // Handle Basic Auth
            const base64Credentials = authHeader.split(" ")[1];
            const credentials = Buffer.from(
                base64Credentials,
                "base64"
            ).toString("utf-8");
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
                const credentials = Buffer.from(token, "base64").toString(
                    "utf-8"
                );
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
    // Health check endpoint
    app.get("/", (req: Request, res: Response) => {
        res.status(200).json({
            status: "healthy",
            service: "DataForSEO MCP Server",
            version: version,
            timestamp: new Date().toISOString(),
        });
    }); // Health check endpoint (alternative)
    app.get("/health", (req: Request, res: Response) => {
        res.status(200).json({
            status: "healthy",
            service: "DataForSEO MCP Server",
            version: version,
            timestamp: new Date().toISOString(),
        });
    });

    // Tools endpoint for n8n integration
    app.get("/tools", authMiddleware, async (req: Request, res: Response) => {
        try {
            // Check credentials
            if (!req.username && !req.password) {
                const envUsername = process.env.DATAFORSEO_USERNAME;
                const envPassword = process.env.DATAFORSEO_PASSWORD;

                if (!envUsername || !envPassword) {
                    res.status(401).json({
                        error: "Authentication required. Provide DataForSEO credentials via Basic Auth or environment variables.",
                    });
                    return;
                }
                req.username = envUsername;
                req.password = envPassword;
            }

            const server = getServer(req.username, req.password);

            // Get tools list via MCP protocol
            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
            });

            await server.connect(transport);

            // Create a mock request to get tools
            const toolsRequest = {
                jsonrpc: "2.0",
                method: "tools/list",
                params: {},
                id: 1,
            };

            // This is a bit hacky but we need to extract tools info
            // For now, let's return a simple list
            res.json({
                service: "DataForSEO MCP Server",
                version: version,
                endpoint: "/tool",
                usage: "POST to /tool with { tool: 'tool_name', arguments: {...} }",
                documentation:
                    "Use POST /tool endpoint to execute specific tools",
            });

            transport.close();
            server.close();
        } catch (error) {
            console.error("Error listing tools:", error);
            res.status(500).json({ error: "Failed to list tools" });
        }
    });

    // Tool execution endpoint for n8n
    app.post("/tool", authMiddleware, async (req: Request, res: Response) => {
        try {
            const { tool, arguments: toolArgs } = req.body;

            if (!tool) {
                res.status(400).json({ error: "Missing 'tool' parameter" });
                return;
            }

            // Check credentials
            if (!req.username && !req.password) {
                const envUsername = process.env.DATAFORSEO_USERNAME;
                const envPassword = process.env.DATAFORSEO_PASSWORD;

                if (!envUsername || !envPassword) {
                    res.status(401).json({
                        error: "Authentication required. Provide DataForSEO credentials via Basic Auth or environment variables.",
                    });
                    return;
                }
                req.username = envUsername;
                req.password = envPassword;
            }

            const server = getServer(req.username, req.password);
            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
            });

            await server.connect(transport);

            // Create MCP tool call request
            const mcpRequest = {
                jsonrpc: "2.0",
                method: "tools/call",
                params: {
                    name: tool,
                    arguments: toolArgs || {},
                },
                id: Date.now(),
            };

            // We need to handle this through the MCP protocol
            // For now, return instructions for using the /mcp endpoint
            res.json({
                message:
                    "Use the /mcp endpoint with proper MCP JSON-RPC format",
                example: {
                    url: "POST /mcp",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Basic <base64-encoded-credentials>",
                    },
                    body: mcpRequest,
                },
            });

            transport.close();
            server.close();
        } catch (error) {
            console.error("Error executing tool:", error);
            res.status(500).json({ error: "Failed to execute tool" });
        }
    });

    // Apply basic auth to MCP endpoint
    app.post("/mcp", authMiddleware, async (req: Request, res: Response) => {
        // In stateless mode, create a new instance of transport and server for each request
        // to ensure complete isolation. A single instance would cause request ID collisions
        // when multiple clients connect concurrently.

        try {
            console.error(Date.now().toLocaleString());

            // Check if we have valid credentials
            if (!req.username && !req.password) {
                // If no request auth, check environment variables
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
                // Use environment variables
                req.username = envUsername;
                req.password = envPassword;
            }

            const server = getServer(req.username, req.password);
            console.error(Date.now().toLocaleString());

            const transport: StreamableHTTPServerTransport =
                new StreamableHTTPServerTransport({
                    sessionIdGenerator: undefined,
                });

            await server.connect(transport);
            console.error("handle request");
            await transport.handleRequest(req, res, req.body);
            console.error("end handle request");
            req.on("close", () => {
                console.error("Request closed");
                transport.close();
                server.close();
            });
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

    app.get("/mcp", async (req: Request, res: Response) => {
        console.error("Received GET MCP request");
        res.status(405).json({
            jsonrpc: "2.0",
            error: {
                code: -32000,
                message: "Method not allowed.",
            },
            id: null,
        });
    });

    app.delete("/mcp", async (req: Request, res: Response) => {
        console.error("Received DELETE MCP request");
        res.status(405).json({
            jsonrpc: "2.0",
            error: {
                code: -32000,
                message: "Method not allowed.",
            },
            id: null,
        });
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
                methods: [
                    "Bearer Token",
                    "Basic Auth",
                    "Environment Variables",
                ],
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
                    description: "MCP protocol endpoint",
                    methods: ["POST"],
                    protocol: "MCP JSON-RPC",
                },
                tools: {
                    path: "/tools",
                    description: "List available tools",
                    methods: ["GET"],
                    protocol: "REST API",
                },
                tool: {
                    path: "/tool",
                    description: "Execute specific tool",
                    methods: ["POST"],
                    protocol: "REST API",
                },
            },
            multi_user_support: {
                enabled: true,
                description:
                    "Each user provides their own DataForSEO credentials",
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
                            message:
                                "DataForSEO rejected the provided credentials",
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

    // Start the server
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    app.listen(PORT, () => {
        console.log(
            `MCP Stateless Streamable HTTP Server listening on port ${PORT}`
        );
    });
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
