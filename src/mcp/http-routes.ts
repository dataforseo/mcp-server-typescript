import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Response } from "express";
import { getTools } from "../core/tools/index.js";
import {
  createAuthMiddleware,
  registerOAuthProtectedResourceRoutes,
  type AuthenticatedRequest,
} from "./auth-middleware.js";
import { initMcpServer } from "./init-mcp-server.js";

export function registerHttpRoutes(app: import("express").Express): void {
  // OAuth discovery is always on; env credentials are request-time fallback only.
  registerOAuthProtectedResourceRoutes(app);

  const authMiddleware = createAuthMiddleware();

  const handleStreamableRequest = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const server = initMcpServer(getTools(req.authHeader));
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);

      req.on("close", () => {
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
  };

  const handleNotAllowed = (method: string) => async (_req: AuthenticatedRequest, res: Response) => {
    console.error(`Received ${method} request`);
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    });
  };

  app.post("/http", authMiddleware, handleStreamableRequest);
  app.post("/mcp", authMiddleware, handleStreamableRequest);
  app.get("/http", handleNotAllowed("GET HTTP"));
  app.get("/mcp", handleNotAllowed("GET MCP"));
  app.delete("/http", handleNotAllowed("DELETE HTTP"));
  app.delete("/mcp", handleNotAllowed("DELETE MCP"));
}

export function registerShutdownHandler(
  server: import("node:http").Server
): void {
  process.on("SIGINT", async () => {
    console.log("Shutting down server...");
    server.close();
    process.exit(0);
  });
}

export function logTransportHelp(): void {
  console.log(`
==============================================
SUPPORTED TRANSPORT OPTIONS:

Streamable HTTP (Protocol version: 2025-03-26)
Endpoints: /http (POST), /mcp (POST)
==============================================
`);
}
