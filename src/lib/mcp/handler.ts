import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { ZodError } from "zod";
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
        try {
          const structured = tool.outputSchema.parse(await tool.run(args));
          return {
            content: [{ type: "text" as const, text: JSON.stringify(structured) }],
            structuredContent: structured as Record<string, unknown>,
          };
        } catch (error) {
          return { isError: true, content: [{ type: "text" as const, text: messageOf(error) }] };
        }
      },
    );
  }
  return server;
}

export async function handleMcpRequest(request: Request): Promise<Response> {
  if (!originAllowed(request.headers.get("host"), request.headers.get("origin"))) {
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
  return transport.handleRequest(request);
}
