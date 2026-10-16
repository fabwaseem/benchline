import { ZodError } from "zod";
import { clientIp } from "@/lib/net/fetch-public";
import { rateLimit } from "@/lib/net/rate-limit";
import { mcpToolBySlug } from "@/registry/mcp-registry";

function messageOf(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`).join("; ");
  }
  return error instanceof Error ? error.message : "The tool failed.";
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const limit = rateLimit(`api:${clientIp(request)}`, 60, 60_000);
  if (!limit.ok) {
    return Response.json(
      { error: "Too many requests." },
      { status: 429, headers: { "retry-after": String(limit.retryAfter), "cache-control": "no-store" } },
    );
  }
  const { slug } = await context.params;
  const tool = mcpToolBySlug(slug);
  if (!tool) {
    return Response.json({ error: "No tool uses that slug." }, { status: 404, headers: { "cache-control": "no-store" } });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a JSON object." }, { status: 400, headers: { "cache-control": "no-store" } });
  }
  try {
    const output = tool.outputSchema.parse(await tool.run(body));
    return Response.json(output, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: messageOf(error) }, { status: 400, headers: { "cache-control": "no-store" } });
  }
}
