import { statsAuthorized } from "@/lib/analytics/auth";
import { getAnalyticsStore } from "@/lib/analytics/store";
import { parseRange } from "@/lib/analytics/stats";
import { isRegisteredSlug, parseSlug } from "@/lib/analytics/slug";
import type { RunSource, StatsFilter } from "@/lib/analytics/types";
import { safeError } from "@/lib/analytics/clean";

function missing() {
  return new Response(null, { status: 404, headers: { "cache-control": "no-store" } });
}

function badFilter() {
  return Response.json({ error: "Invalid filter." }, { status: 400, headers: { "cache-control": "no-store" } });
}

function filterFrom(url: URL): StatsFilter | null {
  const slugRaw = url.searchParams.get("slug");
  let slug: string | null = null;
  if (slugRaw) {
    slug = parseSlug(slugRaw);
    if (!slug || !isRegisteredSlug(slug)) return null;
  }
  const sourceRaw = url.searchParams.get("source");
  let source: RunSource | null = null;
  if (sourceRaw) {
    if (sourceRaw !== "mcp" && sourceRaw !== "api" && sourceRaw !== "web") return null;
    source = sourceRaw;
  }
  const range = parseRange(url.searchParams.get("from"), url.searchParams.get("to"));
  if (!range) return null;
  return { ...range, slug, source };
}

export async function GET(request: Request) {
  if (!statsAuthorized(request.headers.get("authorization"))) return missing();
  const store = getAnalyticsStore();
  if (!store) {
    return Response.json(
      { error: "Analytics database is not configured." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
  const filter = filterFrom(new URL(request.url));
  if (!filter) return badFilter();
  try {
    const report = await store.stats(filter);
    return Response.json(report, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.warn("[analytics] stats request failed", safeError(error));
    return Response.json({ error: "Stats are unavailable." }, { status: 500, headers: { "cache-control": "no-store" } });
  }
}
