import { connection } from "next/server";
import { clientIp } from "@/lib/net/fetch-public";
import { rateLimit } from "@/lib/net/rate-limit";
import { PublicUrlError } from "@/lib/net/ssrf";

export async function guard(request: Request) {
  await connection();
  const limit = rateLimit(clientIp(request));
  if (!limit.ok) {
    return Response.json(
      { error: "Too many checks. Try again in a few minutes." },
      { status: 429, headers: { "retry-after": String(limit.retryAfter), "cache-control": "no-store" } },
    );
  }
  return null;
}

export async function readBody(request: Request) {
  const text = await request.text();
  if (text.length > 200_000) throw new PublicUrlError("Request body is too large.");
  return JSON.parse(text) as unknown;
}

export function toolError(error: unknown) {
  if (error instanceof PublicUrlError) {
    return Response.json({ error: error.message }, { status: 400, headers: { "cache-control": "no-store" } });
  }
  if (error instanceof Error && error.name === "TimeoutError") {
    return Response.json({ error: "The request timed out after 8 seconds." }, { status: 504, headers: { "cache-control": "no-store" } });
  }
  const message = error instanceof Error ? error.message : "The check failed.";
  return Response.json({ error: message }, { status: 502, headers: { "cache-control": "no-store" } });
}

export function toolJson(data: unknown) {
  return Response.json(data, { headers: { "cache-control": "no-store" } });
}
