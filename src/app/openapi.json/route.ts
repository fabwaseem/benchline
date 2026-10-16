import { openApiDocument } from "@/lib/mcp/openapi";

export function GET() {
  return Response.json(openApiDocument(), {
    headers: { "cache-control": "public, max-age=3600" },
  });
}
