import { ZodError } from "zod";
import { byteSize, classifyError } from "@/lib/analytics/clean";
import { requestContext } from "@/lib/analytics/context";
import { recordRun } from "@/lib/analytics/record";
import { parseSlug } from "@/lib/analytics/slug";
import { clientIp } from "@/lib/net/fetch-public";
import { rateLimit } from "@/lib/net/rate-limit";
import { mcpToolBySlug } from "@/registry/mcp-registry";

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
    /* analytics must not change the API response */
  }
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const started = performance.now();
  const { slug: rawSlug } = await context.params;
  const slug = parseSlug(rawSlug) ?? "";
  const limit = rateLimit(`api:${clientIp(request)}`, 60, 60_000);
  if (!limit.ok) {
    safe(() =>
      recordRun(requestContext(request), {
        slug,
        source: "api",
        outcome: "rejected",
        errorCode: "rate_limit",
        durationMs: Math.round(performance.now() - started),
        inputBytes: null,
        outputBytes: null,
      }),
    );
    return Response.json(
      { error: "Too many requests." },
      { status: 429, headers: { "retry-after": String(limit.retryAfter), "cache-control": "no-store" } },
    );
  }
  const tool = slug ? mcpToolBySlug(slug) : undefined;
  if (!tool) {
    if (slug) {
      safe(() =>
        recordRun(requestContext(request), {
          slug,
          source: "api",
          outcome: "rejected",
          errorCode: "unknown_tool",
          durationMs: Math.round(performance.now() - started),
          inputBytes: null,
          outputBytes: null,
        }),
      );
    }
    return Response.json({ error: "No tool uses that slug." }, { status: 404, headers: { "cache-control": "no-store" } });
  }
  let text: string;
  try {
    text = await request.text();
  } catch {
    safe(() =>
      recordRun(requestContext(request), {
        slug,
        source: "api",
        outcome: "rejected",
        errorCode: "invalid_json",
        durationMs: Math.round(performance.now() - started),
        inputBytes: null,
        outputBytes: null,
      }),
    );
    return Response.json({ error: "Send a JSON object." }, { status: 400, headers: { "cache-control": "no-store" } });
  }
  const inputBytes = Buffer.byteLength(text);
  let body: unknown;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    safe(() =>
      recordRun(requestContext(request), {
        slug,
        source: "api",
        outcome: "rejected",
        errorCode: "invalid_json",
        durationMs: Math.round(performance.now() - started),
        inputBytes,
        outputBytes: null,
      }),
    );
    return Response.json({ error: "Send a JSON object." }, { status: 400, headers: { "cache-control": "no-store" } });
  }
  try {
    const output = tool.outputSchema.parse(await tool.run(body));
    safe(() =>
      recordRun(requestContext(request), {
        slug,
        source: "api",
        outcome: "ok",
        errorCode: null,
        durationMs: Math.round(performance.now() - started),
        inputBytes,
        outputBytes: byteSize(output),
      }),
    );
    return Response.json(output, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const classified = classifyError(error);
    safe(() =>
      recordRun(requestContext(request), {
        slug,
        source: "api",
        outcome: classified.outcome,
        errorCode: classified.errorCode,
        durationMs: Math.round(performance.now() - started),
        inputBytes,
        outputBytes: null,
      }),
    );
    return Response.json({ error: messageOf(error) }, { status: 400, headers: { "cache-control": "no-store" } });
  }
}
