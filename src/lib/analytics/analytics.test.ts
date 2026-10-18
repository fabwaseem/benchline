import { afterEach, describe, expect, it, vi } from "vitest";
import { countryCode, countryFor, countryFromHeaders, countryFromRecord } from "@/lib/analytics/country";
import { geodbUrls, lookupCountry, setGeoReaderForTests } from "@/lib/analytics/geodb";
import { hashIp, sessionKey } from "@/lib/analytics/hash";
import { analyticsIp } from "@/lib/analytics/ip";
import { applyMigrations } from "@/lib/analytics/migrate";
import { createMemoryStore } from "@/lib/analytics/memory";
import { createQueue } from "@/lib/analytics/queue";
import { createRateLimit } from "@/lib/analytics/rate-limit";
import { isRegisteredSlug, parseSlug } from "@/lib/analytics/slug";
import { durationFromRuns, parseRange, summarizeRuns } from "@/lib/analytics/stats";
import { enqueue, flushAnalytics, resetAnalyticsForTests, setAnalyticsStore } from "@/lib/analytics/store";
import { sanitizeSearchQuery } from "@/lib/analytics/text";
import type { AnalyticsEvent, ToolRunEvent } from "@/lib/analytics/types";

function headers(values: Record<string, string>) {
  return { get: (name: string) => values[name.toLowerCase()] ?? null };
}

function run(partial: Partial<ToolRunEvent> = {}): ToolRunEvent {
  return {
    kind: "run",
    ts: "2026-06-01T12:00:00.000Z",
    slug: "json-formatter",
    source: "web",
    outcome: "ok",
    errorCode: null,
    durationMs: 40,
    inputBytes: 12,
    outputBytes: 14,
    ipHash: "abc",
    country: "US",
    uaFamily: "chrome",
    referrerHost: null,
    visitorId: null,
    sessionId: null,
    mcpSessionId: null,
    mcpClientName: null,
    mcpClientVersion: null,
    mcpProtocol: null,
    mcpHost: null,
    ...partial,
  };
}

describe("analytics privacy helpers", () => {
  afterEach(() => {
    setGeoReaderForTests(null);
    resetAnalyticsForTests();
  });

  it("hashes an address with the salt and the UTC day", () => {
    const day = new Date("2026-01-02T03:00:00.000Z");
    const later = new Date("2026-01-02T23:00:00.000Z");
    const next = new Date("2026-01-03T00:00:00.000Z");
    const first = hashIp("203.0.113.10", "salt", day);
    expect(first).toBe(hashIp("203.0.113.10", "salt", later));
    expect(first).not.toBe(hashIp("203.0.113.10", "salt", next));
    expect(first).not.toBe(hashIp("203.0.113.11", "salt", day));
    expect(first).not.toContain("203.0.113.10");
    expect(hashIp("203.0.113.10", "")).toBeNull();
    expect(hashIp("  ", "salt")).toBeNull();
  });

  it("keeps a safe session token and hashes anything else", () => {
    expect(sessionKey("abc_DEF-1")).toBe("abc_DEF-1");
    expect(sessionKey("has spaces")).toMatch(/^[a-f0-9]{64}$/);
    expect(sessionKey("")).toBeNull();
  });

  it("reads the Traefik peer from X-Real-Ip, then the first forwarded hop", () => {
    expect(analyticsIp({ headers: headers({ "x-real-ip": "203.0.113.10", "x-forwarded-for": "198.51.100.8, 10.0.0.1" }) })).toBe("203.0.113.10");
    expect(analyticsIp({ headers: headers({ "x-forwarded-for": " 198.51.100.8, 10.0.0.1 " }) })).toBe("198.51.100.8");
    expect(analyticsIp({ headers: headers({ "x-real-ip": "203.0.113.10, 198.51.100.8" }) })).toBeNull();
    expect(analyticsIp({ headers: headers({}) })).toBeNull();
  });

  it("uses the country lookup and falls back to a header", () => {
    const header = headers({ "cf-ipcountry": "de" });
    expect(countryFor("203.0.113.10", header, () => "US")).toBe("US");
    expect(countryFor("203.0.113.10", header, () => null)).toBe("DE");
    expect(countryFor("203.0.113.10", header, () => { throw new Error("closed"); })).toBe("DE");
    expect(countryFor(null, headers({ "x-vercel-ip-country": "xx" }), () => "US")).toBeNull();
    expect(countryCode("a1")).toBeNull();
    expect(countryFromHeaders(headers({ "cloudfront-viewer-country": "fr" }))).toBe("FR");
  });

  it("keeps only the country code from a database record", () => {
    expect(
      countryFromRecord({
        country: { iso_code: "JP", names: { en: "Japan" } },
        ip: "203.0.113.10",
        city: { names: { en: "Tokyo" } },
      }),
    ).toBe("JP");
    expect(countryFromRecord({ registered_country: { iso_code: "se" } })).toBe("SE");
    expect(countryFromRecord({ country_code: "T1" })).toBeNull();
    expect(countryFromRecord(null)).toBeNull();
  });

  it("builds DB-IP month URLs and leaves country empty when the file is missing", () => {
    expect(geodbUrls(new Date("2026-01-15T00:00:00.000Z"))).toEqual([
      "https://download.db-ip.com/free/dbip-country-lite-2026-01.mmdb.gz",
      "https://download.db-ip.com/free/dbip-country-lite-2025-12.mmdb.gz",
      "https://download.db-ip.com/free/dbip-country-lite-2025-11.mmdb.gz",
    ]);
    expect(lookupCountry("8.8.8.8")).toBeNull();
    expect(() => lookupCountry("not-an-ip")).not.toThrow();
  });

  it("accepts registered slugs and drops URL-like search text", () => {
    expect(parseSlug("JSON-Formatter")).toBe("json-formatter");
    expect(parseSlug("../json")).toBeNull();
    expect(isRegisteredSlug("json-formatter")).toBe(true);
    expect(isRegisteredSlug("not-a-tool")).toBe(false);
    expect(sanitizeSearchQuery("json formatter")).toBe("json formatter");
    expect(sanitizeSearchQuery("https://secret.example/path")).toBeNull();
    expect(sanitizeSearchQuery("aaaaaaaa.bbbbbbbb.cccccccc")).toBeNull();
  });

  it("rate limits a key inside its window", () => {
    const limit = createRateLimit(2, 1_000);
    expect(limit.check("a", 0).ok).toBe(true);
    expect(limit.check("a", 10).ok).toBe(true);
    expect(limit.check("a", 20).ok).toBe(false);
    expect(limit.check("b", 20).ok).toBe(true);
    limit.reset();
    expect(limit.check("a", 20).ok).toBe(true);
  });
});

describe("analytics queue and rollup", () => {
  afterEach(() => {
    vi.useRealTimers();
    resetAnalyticsForTests();
  });

  it("flushes on the interval, drops overflow, and drops a failed batch", async () => {
    vi.useFakeTimers();
    const batches: AnalyticsEvent[][] = [];
    const warnings: string[] = [];
    const queue = createQueue({
      write: async (events) => {
        batches.push(events);
      },
      batch: 50,
      intervalMs: 3_000,
      warn: (message) => warnings.push(message),
    });
    queue.push(run());
    expect(queue.size()).toBe(1);
    await vi.advanceTimersByTimeAsync(3_000);
    expect(batches).toHaveLength(1);
    expect(queue.size()).toBe(0);

    const full = createQueue({
      write: async () => undefined,
      max: 2,
      batch: 50,
      warn: (message) => warnings.push(message),
    });
    full.push(run());
    full.push(run());
    full.push(run());
    expect(full.size()).toBe(2);
    expect(full.dropped()).toBe(1);

    const failing = createQueue({
      write: async () => {
        throw new Error("connect postgres://user:secret@db/benchline failed");
      },
      batch: 50,
      warn: (message) => warnings.push(message),
    });
    failing.push(run({ slug: "lost" }));
    await failing.flush();
    expect(failing.size()).toBe(0);
    expect(warnings.join(" ")).toContain("postgres://redacted");
    expect(warnings.join(" ")).not.toContain("secret");
  });

  it("is a no-op until a store is set", async () => {
    const store = createMemoryStore();
    enqueue(run());
    await flushAnalytics();
    setAnalyticsStore(store);
    await flushAnalytics();
    expect(store.events()).toHaveLength(0);
    enqueue(run());
    await flushAnalytics();
    expect(store.events()).toHaveLength(1);
  });

  it("applies each migration once under the lock", async () => {
    const applied: string[] = [];
    let inside = false;
    const driver = {
      async bootstrap() {},
      async locked(task: (tx: { applied(): Promise<string[]>; apply(migration: { version: string }): Promise<void> }) => Promise<void>) {
        expect(inside).toBe(false);
        inside = true;
        await task({
          async applied() {
            return [...applied];
          },
          async apply(migration) {
            applied.push(migration.version);
          },
        });
        inside = false;
      },
    };
    const migrations = [{ version: "001_analytics", statements: ["select 1"] }];
    await applyMigrations(driver, migrations);
    await applyMigrations(driver, migrations);
    expect(applied).toEqual(["001_analytics"]);
  });

  it("summarizes runs and keeps rolled-up days after raw rows are pruned", async () => {
    const events = [10, 20, 30, 40, 100].map((durationMs, index) =>
      run({ durationMs, ts: `2026-06-01T12:00:0${index}.000Z`, outcome: index === 4 ? "error" : "ok", errorCode: index === 4 ? "timeout" : null }),
    );
    const summary = summarizeRuns([], durationFromRuns(events), null);
    const rows = events.map((event) => ({
      slug: event.slug,
      source: event.source,
      outcome: event.outcome,
      day: "2026-06-01",
      country: "US",
      mcpClient: "",
      mcpVersion: "",
      runs: 1,
      errors: event.outcome === "error" ? 1 : 0,
    }));
    const counted = summarizeRuns(rows, durationFromRuns(events), null);
    expect(counted.runs).toBe(5);
    expect(counted.errorRate).toBe(0.2);
    expect(counted.duration.source).toBe("raw");
    expect(counted.duration.p50).toBe(summary.duration.p50);
    expect(counted.duration.p95).not.toBeNull();
    expect(counted.byTool[0]?.slug).toBe("json-formatter");

    const store = createMemoryStore();
    await store.write([run({ ts: "2026-01-01T12:00:00.000Z", durationMs: 80, mcpClientName: "cursor", source: "mcp", mcpHost: "benchline" })]);
    await store.retain(90, new Date("2026-06-01T00:00:00.000Z"));
    expect(store.events()).toHaveLength(0);
    const report = await store.stats({
      from: new Date("2025-12-01T00:00:00.000Z"),
      to: new Date("2026-06-02T00:00:00.000Z"),
      slug: "json-formatter",
      source: "mcp",
    });
    expect(report.runs).toBe(1);
    expect(report.duration.source).toBe("histogram");
    expect(report.topCountries[0]?.country).toBe("US");
    expect(report.topMcpClients[0]?.name).toBe("cursor");
    expect(parseRange("2026-01-01", "2026-01-01")).toBeNull();
    expect(parseRange("2020-01-01", "2026-01-01")).toBeNull();
    expect(parseRange(null, "2026-06-01T00:00:00.000Z")?.from.toISOString()).toBe("2026-05-02T00:00:00.000Z");
  });
});
