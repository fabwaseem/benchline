import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { ZodError } from "zod";
import { byteSize, classifyError } from "@/lib/analytics/clean";
import { requestContext } from "@/lib/analytics/context";
import { knownMcpTool, loadMcpAnalytics, recordMcpTool, runWithMcpContext } from "@/lib/analytics/mcp-meta";
import { recordRun } from "@/lib/analytics/record";
import { originAllowed } from "@/lib/mcp/origin";
import { clientIp } from "@/lib/net/fetch-public";
import { rateLimit } from "@/lib/net/rate-limit";
import { mcpTools } from "@/registry/mcp-registry";

function messageOf(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`).join("; ");
  }
  return error instanceof Error ? error.message : "The tool failed.";
}

function safe(fn: () => void) {
  try {
    fn();
  } catch {
    /* analytics must not change the MCP response */
  }
}

function createServer() {
  const server = new McpServer({ name: "benchline", version: "1.0.0" });
  for (const tool of mcpTools) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
          openWorldHint: tool.openWorld,
        },
      },
      async (args) => {
        const started = performance.now();
        const inputBytes = byteSize(args);
        try {
          const structured = tool.outputSchema.parse(await tool.run(args));
          safe(() =>
            recordMcpTool({
              slug: tool.slug,
              outcome: "ok",
              errorCode: null,
              durationMs: Math.round(performance.now() - started),
              inputBytes,
              outputBytes: byteSize(structured),
            }),
          );
          return {
            content: [{ type: "text" as const, text: JSON.stringify(structured) }],
            structuredContent: structured as Record<string, unknown>,
          };
        } catch (error) {
          const classified = classifyError(error);
          safe(() =>
            recordMcpTool({
              slug: tool.slug,
              outcome: classified.outcome,
              errorCode: classified.errorCode,
              durationMs: Math.round(performance.now() - started),
              inputBytes,
              outputBytes: null,
            }),
          );
          return { isError: true, content: [{ type: "text" as const, text: messageOf(error) }] };
        }
      },
    );
  }
  return server;
}

export async function handleMcpRequest(request: Request): Promise<Response> {
  if (!originAllowed(request.headers.get("host"), request.headers.get("origin"))) {
    safe(() =>
      recordRun(requestContext(request), {
        slug: "",
        source: "mcp",
        outcome: "rejected",
        errorCode: "origin",
        durationMs: null,
        inputBytes: null,
        outputBytes: null,
      }),
    );
    return Response.json(
      { jsonrpc: "2.0", error: { code: -32000, message: "Origin is not allowed." }, id: null },
      { status: 403, headers: { "cache-control": "no-store" } },
    );
  }
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { allow: "POST", "cache-control": "no-store" },
    });
  }
  const limit = rateLimit(`mcp:${clientIp(request)}`, 60, 60_000);
  if (!limit.ok) {
    safe(() =>
      recordRun(requestContext(request), {
        slug: "",
        source: "mcp",
        outcome: "rejected",
        errorCode: "rate_limit",
        durationMs: null,
        inputBytes: null,
        outputBytes: null,
      }),
    );
    return Response.json(
      { jsonrpc: "2.0", error: { code: -32000, message: "Too many requests." }, id: null },
      { status: 429, headers: { "retry-after": String(limit.retryAfter), "cache-control": "no-store" } },
    );
  }
  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  let analytics: Awaited<ReturnType<typeof loadMcpAnalytics>> | null = null;
  try {
    analytics = await loadMcpAnalytics(request);
  } catch {
    analytics = null;
  }
  if (analytics?.toolName && !knownMcpTool(analytics.toolName)) {
    const ctx = analytics;
    safe(() =>
      recordRun(ctx, {
        slug: "",
        source: "mcp",
        outcome: "rejected",
        errorCode: "unknown_tool",
        durationMs: null,
        inputBytes: null,
        outputBytes: null,
        mcpSessionId: ctx.mcpSessionId,
        mcpClientName: ctx.mcpClientName,
        mcpClientVersion: ctx.mcpClientVersion,
        mcpProtocol: ctx.mcpProtocol,
        mcpHost: ctx.mcpHost,
      }),
    );
  }
  if (!analytics) return transport.handleRequest(request);
  return runWithMcpContext(analytics, () => transport.handleRequest(request));
}
