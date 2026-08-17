import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAuthServerUrl } from "../config/index.js";
import {
  buildWwwAuthenticateHeader,
  oauthProtectedResourcePayload,
  resolveAuthHeader,
} from "../core/api/resolve-auth.js";
import { initializeFieldConfiguration } from "../core/config/field-configuration.js";
import { setDocsCacheBackend } from "../core/docs/cache-config.js";
import {
  apiRequestTool,
  docsIndexTool,
  docsListSectionsTool,
  docsSearchTool,
} from "../core/tools/index.js";
import { ApiRequestTool } from "../core/tools/api-request-tool.js";
import { McpServerInstructions } from "../mcp/instructions.js";
import { buildToolDefinition, toMcpResponse } from "../mcp/tool-definition.js";
import { name, version } from "./version.worker.js";

const SERVER_NAME = `${name} (Worker)`;
const SERVER_VERSION = version;

type AuthProps = {
  authHeader?: string;
};

globalThis.__PACKAGE_VERSION__ = version;
globalThis.__PACKAGE_NAME__ = name;

setDocsCacheBackend("memory");

/**
 * DataForSEO MCP Agent for Cloudflare Workers.
 * Per-request auth is passed via ctx.props.authHeader (OAuth Bearer / Basic / env fallback).
 */
export class DataForSEOUniversalMcpAgent extends McpAgent<
  Env,
  unknown,
  AuthProps
> {
  server = new McpServer(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: { logging: {} },
      instructions: McpServerInstructions.TEXT,
    }
  );

  constructor(ctx: DurableObjectState, protected env: Env) {
    super(ctx, env);
  }

  async init() {
    const workerEnv = this.env || (globalThis as { workerEnv?: Env }).workerEnv;
    if (!workerEnv) {
      throw new Error("Worker environment not available");
    }

    (globalThis as { workerEnv?: Env }).workerEnv = workerEnv;

    const readOnlyTools = [docsIndexTool, docsListSectionsTool, docsSearchTool];
    for (const tool of readOnlyTools) {
      const definition = buildToolDefinition(tool);
      const schema = z.object(definition.params);
      this.server.tool(tool.name, schema.shape, definition.handler);
    }

    const apiDefinition = buildToolDefinition(apiRequestTool);
    const apiSchema = z.object(apiDefinition.params);
    this.server.tool(apiRequestTool.name, apiSchema.shape, async (args) => {
      const authHeader = this.props?.authHeader;
      const tool = new ApiRequestTool(authHeader);
      return toMcpResponse(await tool.invoke(args));
    });
  }
}

function createJsonResponse(
  status: number,
  body: unknown,
  headers?: HeadersInit
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

function oauthMetadataResponse(
  request: Request,
  resourcePath: string
): Response {
  const url = new URL(request.url);
  const base = `${url.protocol}//${url.host}`;
  const resource = resourcePath ? `${base}/${resourcePath}` : base;
  return createJsonResponse(
    200,
    oauthProtectedResourcePayload(resource, getAuthServerUrl())
  );
}

function unauthorizedResponse(
  request: Request,
  reason: "expired_bearer" | "missing"
): Response {
  const url = new URL(request.url);
  const metadataUrl = `${url.protocol}//${url.host}/.well-known/oauth-protected-resource`;
  return createJsonResponse(
    401,
    {
      error: reason === "expired_bearer" ? "invalid_token" : "invalid auth",
      error_description:
        reason === "expired_bearer" ? "expired bearer token" : "invalid auth",
    },
    {
      "WWW-Authenticate": buildWwwAuthenticateHeader(metadataUrl, reason),
    }
  );
}

type WorkerExecutionContext = ExecutionContext & {
  props?: AuthProps;
};

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: WorkerExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    (globalThis as { workerEnv?: Env }).workerEnv = env;
    globalThis.__PACKAGE_VERSION__ = version;
    globalThis.__PACKAGE_NAME__ = name;
    setDocsCacheBackend("memory");
    await initializeFieldConfiguration();

    if (url.pathname === "/health" && request.method === "GET") {
      return createJsonResponse(200, {
        status: "healthy",
        server: SERVER_NAME,
        version: SERVER_VERSION,
        timestamp: new Date().toISOString(),
      });
    }

    // OAuth discovery is always available (default auth path).
    if (
      url.pathname === "/.well-known/oauth-protected-resource" ||
      url.pathname === "/.well-known/oauth-protected-resource/"
    ) {
      return oauthMetadataResponse(request, "");
    }
    if (url.pathname === "/.well-known/oauth-protected-resource/mcp") {
      return oauthMetadataResponse(request, "mcp");
    }
    if (url.pathname === "/.well-known/oauth-protected-resource/http") {
      return oauthMetadataResponse(request, "http");
    }

    const isMcpPath = ["/mcp", "/http", "/sse", "/sse/message"].includes(
      url.pathname
    );

    if (isMcpPath) {
      const resolved = resolveAuthHeader(
        request.headers.get("authorization") ?? undefined
      );
      if (!resolved.ok) {
        return unauthorizedResponse(request, resolved.reason);
      }

      ctx.props = {
        ...(ctx.props ?? {}),
        authHeader: resolved.authHeader,
      };

      // agents/mcp only calls DO._init(props) on the initialize request.
      // Refresh auth on later requests so api_request uses the current Bearer.
      const sessionId = request.headers.get("mcp-session-id");
      if (sessionId) {
        const doId = env.MCP_OBJECT.idFromName(
          `streamable-http:${sessionId}`
        );
        const stub = env.MCP_OBJECT.get(
          doId
        ) as DurableObjectStub<DataForSEOUniversalMcpAgent>;
        await stub._init({ authHeader: resolved.authHeader });
      }
    }

    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return DataForSEOUniversalMcpAgent.serveSSE("/sse").fetch(
        request,
        env,
        ctx
      );
    }

    if (url.pathname === "/mcp") {
      return DataForSEOUniversalMcpAgent.serve("/mcp").fetch(request, env, ctx);
    }

    if (url.pathname === "/http") {
      return DataForSEOUniversalMcpAgent.serve("/http").fetch(
        request,
        env,
        ctx
      );
    }

    return new Response("Not found", { status: 404 });
  },
};
