import { toolApiIndex } from "@/lib/mcp/agent-docs";

/** The tool catalogue as JSON. Each entry's url takes POST to run the tool, GET for its schemas. */
export function GET() {
  return Response.json(toolApiIndex(), {
    headers: { "cache-control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
