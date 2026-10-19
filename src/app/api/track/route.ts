import { originAllowed } from "@/lib/mcp/origin";
import { isBotUserAgent, isPrefetch } from "@/lib/analytics/bot";
import { requestContext } from "@/lib/analytics/context";
import { analyticsIp } from "@/lib/analytics/ip";
import { trackRateLimit } from "@/lib/analytics/rate-limit";
import { recordAction, recordPage, recordRun, recordSearch, recordToolOpen } from "@/lib/analytics/record";
import { deviceClassFromUa, isAdminPath } from "@/lib/analytics/text";
import { isHealthPath } from "@/lib/net/legacy-host";
import { parseTrackBody } from "@/lib/analytics/track-body";

const MAX_BODY = 4096;

function empty(status: number, extra?: Record<string, string>) {
  return new Response(null, { status, headers: { "cache-control": "no-store", ...extra } });
}

export async function POST(request: Request) {
  if (!originAllowed(request.headers.get("host"), request.headers.get("origin"))) return empty(204);
  if (isBotUserAgent(request.headers.get("user-agent")) || isPrefetch(request.headers)) return empty(204);
  const ip = analyticsIp(request) ?? "unknown";
  const limit = trackRateLimit(ip);
  if (!limit.ok) return empty(429, { "retry-after": String(limit.retryAfter) });
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY) return empty(413);
  let text = "";
  try {
    text = await request.text();
  } catch {
    return empty(400);
  }
  if (text.length > MAX_BODY) return empty(413);
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return empty(400);
  }
  const parsed = parseTrackBody(json);
  if (parsed === "drop") return empty(204);
  if (!parsed) return empty(400);
  if (parsed.type === "page" && (isAdminPath(parsed.path) || isHealthPath(parsed.path))) return empty(204);
  const base = requestContext(request);
  const ctx = {
    ...base,
    visitorId: base.visitorId ?? parsed.visitorId,
    sessionId: base.sessionId ?? parsed.sessionId,
  };
  const shared = {
    ipHash: ctx.ipHash,
    country: ctx.country,
    uaFamily: ctx.uaFamily,
    visitorId: ctx.visitorId,
    sessionId: ctx.sessionId,
  };
  if (parsed.type === "run") {
    recordRun(ctx, {
      slug: parsed.slug,
      source: "web",
      outcome: parsed.outcome,
      errorCode: parsed.errorCode,
      durationMs: parsed.durationMs,
      inputBytes: parsed.inputBytes,
      outputBytes: parsed.outputBytes,
    });
  } else if (parsed.type === "page") {
    recordPage({
      ...shared,
      path: parsed.path,
      referrerHost: parsed.referrerHost ?? ctx.referrerHost,
      utmSource: parsed.utmSource,
      utmMedium: parsed.utmMedium,
      utmCampaign: parsed.utmCampaign,
      utmTerm: parsed.utmTerm,
      utmContent: parsed.utmContent,
      deviceClass: parsed.deviceClass ?? deviceClassFromUa(request.headers.get("user-agent")),
    });
  } else if (parsed.type === "tool_open") {
    recordToolOpen({
      ...shared,
      slug: parsed.slug,
      referrerHost: parsed.referrerHost ?? ctx.referrerHost,
      deviceClass: parsed.deviceClass ?? deviceClassFromUa(request.headers.get("user-agent")),
    });
  } else if (parsed.type === "search") {
    recordSearch({ ...shared, query: parsed.query });
  } else {
    recordAction({ ...shared, action: parsed.action, slug: parsed.slug });
  }
  return empty(204);
}
