import { wellKnownMcp } from "@/lib/mcp/agent-docs";

/** A server card for MCP clients and crawlers that look in /.well-known. */
export function GET() {
  return Response.json(wellKnownMcp(), {
    headers: { "cache-control": "public, max-age=3600, stale-while-revalidate=86400", "access-control-allow-origin": "*" },
  });
}
