import { afterEach, describe, expect, it } from "vitest";
import { POST as track } from "@/app/api/track/route";
import { GET as stats } from "@/app/api/v1/stats/route";
import { POST as apiTool } from "@/app/api/v1/tools/[slug]/route";
import { hashIp } from "@/lib/analytics/hash";
import { createMemoryStore } from "@/lib/analytics/memory";
import { resetTrackRateLimit } from "@/lib/analytics/rate-limit";
import { flushAnalytics, resetAnalyticsForTests, setAnalyticsStore } from "@/lib/analytics/store";
import { handleMcpRequest } from "@/lib/mcp/handler";
import { resetRateLimit } from "@/lib/net/rate-limit";
import type { AnalyticsEvent } from "@/lib/analytics/types";

const salt = "test-salt";

function memory() {
  const store = createMemoryStore();
  setAnalyticsStore(store);
  return store;
}

async function settled(store: { events(): AnalyticsEvent[] }) {
  await flushAnalytics();
  return store.events();
}

describe("usage endpoints", () => {
  afterEach(() => {
    resetAnalyticsForTests();
    resetTrackRateLimit();
    resetRateLimit();
    delete process.env.STATS_TOKEN;
    delete process.env.ANALYTICS_SALT;
  });

  it("ignores bots, oversized bodies, unknown slugs, and URL searches", async () => {
    const store = memory();
    const bot = await track(
      new Request("https://benchline.fabwaseem.com/api/track", {
        method: "POST",
        headers: { host: "benchline.fabwaseem.com", "content-type": "application/json", "user-agent": "Mozilla/5.0 Googlebot" },
        body: JSON.stringify({ type: "search", query: "json formatter" }),
      }),
    );
    expect(bot.status).toBe(204);
    const huge = await track(
      new Request("https://benchline.fabwaseem.com/api/track", {
        method: "POST",
        headers: { host: "benchline.fabwaseem.com", "content-type": "application/json" },
        body: JSON.stringify({ type: "page", path: `/${"a".repeat(5000)}` }),
      }),
    );
    expect(huge.status).toBe(413);
    const unknown = await track(
      new Request("https://benchline.fabwaseem.com/api/track", {
        method: "POST",
        headers: { host: "benchline.fabwaseem.com", "content-type": "application/json" },
        body: JSON.stringify({ type: "run", slug: "not-a-tool", outcome: "ok" }),
      }),
    );
    expect(unknown.status).toBe(400);
    const dropped = await track(
      new Request("https://benchline.fabwaseem.com/api/track", {
        method: "POST",
        headers: { host: "benchline.fabwaseem.com", "content-type": "application/json" },
        body: JSON.stringify({ type: "search", query: "https://secret.example/a" }),
      }),
    );
    expect(dropped.status).toBe(204);
    const foreign = await track(
      new Request("https://benchline.fabwaseem.com/api/track", {
        method: "POST",
        headers: { host: "benchline.fabwaseem.com", origin: "https://evil.example", "content-type": "application/json" },
        body: JSON.stringify({ type: "search", query: "json formatter" }),
      }),
    );
    expect(foreign.status).toBe(204);
    expect(await settled(store)).toHaveLength(0);
    const admin = await track(
      new Request("https://benchline.fabwaseem.com/api/track", {
        method: "POST",
        headers: { host: "benchline.fabwaseem.com", "content-type": "application/json" },
        body: JSON.stringify({ type: "page", path: "/admin" }),
      }),
    );
    expect(admin.status).toBe(204);
    const health = await track(
      new Request("https://benchline.fabwaseem.com/api/track", {
        method: "POST",
        headers: { host: "benchline.fabwaseem.com", "content-type": "application/json" },
        body: JSON.stringify({ type: "page", path: "/api/health" }),
      }),
    );
    expect(health.status).toBe(204);
    expect(await settled(store)).toHaveLength(0);
  });

  it("stores a search and then rate limits the address", async () => {
    const store = memory();
    const headers = { host: "benchline.fabwaseem.com", "content-type": "application/json", "x-real-ip": "203.0.113.20" };
    const ok = await track(
      new Request("https://benchline.fabwaseem.com/api/track", {
        method: "POST",
        headers,
        body: JSON.stringify({ type: "search", query: "json formatter", url: "https://secret.example" }),
      }),
    );
    expect(ok.status).toBe(204);
    const events = await settled(store);
    expect(events).toHaveLength(1);
    expect(JSON.stringify(events)).not.toContain("secret.example");
    expect(JSON.stringify(events)).not.toContain("203.0.113.20");
    if (events[0]?.kind === "search") expect(events[0].query).toBe("json formatter");
    for (let i = 0; i < 29; i += 1) {
      const response = await track(
        new Request("https://benchline.fabwaseem.com/api/track", {
          method: "POST",
          headers,
          body: JSON.stringify({ type: "search", query: `q${i}x` }),
        }),
      );
      expect(response.status).toBe(204);
    }
    const limited = await track(
      new Request("https://benchline.fabwaseem.com/api/track", {
        method: "POST",
        headers,
        body: JSON.stringify({ type: "search", query: "last query" }),
      }),
    );
    expect(limited.status).toBe(429);
  });

  it("hides stats unless the bearer token matches", async () => {
    process.env.STATS_TOKEN = "stats-token-value";
    const missing = await stats(new Request("https://benchline.fabwaseem.com/api/v1/stats"));
    expect(missing.status).toBe(404);
    const wrong = await stats(
      new Request("https://benchline.fabwaseem.com/api/v1/stats", { headers: { authorization: "Bearer wrong-token-value" } }),
    );
    expect(wrong.status).toBe(404);
    const unconfigured = await stats(
      new Request("https://benchline.fabwaseem.com/api/v1/stats", { headers: { authorization: "Bearer stats-token-value" } }),
    );
    expect(unconfigured.status).toBe(503);
    const store = memory();
    await store.write([
      {
        kind: "run",
        ts: new Date(Date.now() - 60_000).toISOString(),
        slug: "json-formatter",
        source: "api",
        outcome: "ok",
        errorCode: null,
        durationMs: 15,
        inputBytes: 2,
        outputBytes: 2,
        ipHash: "abc",
        country: "US",
        uaFamily: "curl",
        referrerHost: null,
        visitorId: null,
        sessionId: null,
        mcpSessionId: null,
        mcpClientName: null,
        mcpClientVersion: null,
        mcpProtocol: null,
        mcpHost: null,
      },
    ]);
    const bad = await stats(
      new Request("https://benchline.fabwaseem.com/api/v1/stats?from=2026-02-01&to=2026-01-01", {
        headers: { authorization: "Bearer stats-token-value" },
      }),
    );
    expect(bad.status).toBe(400);
    const report = await stats(
      new Request("https://benchline.fabwaseem.com/api/v1/stats?slug=json-formatter&source=api", {
        headers: { authorization: "Bearer stats-token-value" },
      }),
    );
    expect(report.status).toBe(200);
    const body = (await report.json()) as { runs: number; byTool: { slug: string }[] };
    expect(body.runs).toBe(1);
    expect(body.byTool[0]?.slug).toBe("json-formatter");
    delete process.env.STATS_TOKEN;
    const hidden = await stats(
      new Request("https://benchline.fabwaseem.com/api/v1/stats", { headers: { authorization: "Bearer stats-token-value" } }),
    );
    expect(hidden.status).toBe(404);
  });

  it("records an API run without the submitted document", async () => {
    process.env.ANALYTICS_SALT = salt;
    const store = memory();
    const secret = "https://secret.example/user-token";
    const response = await apiTool(
      new Request("https://benchline.fabwaseem.com/api/v1/tools/json-formatter", {
        method: "POST",
        headers: {
          host: "benchline.fabwaseem.com",
          "content-type": "application/json",
          "x-real-ip": "203.0.113.50",
          "x-forwarded-for": "198.51.100.8",
          "user-agent": "curl/8.7.1",
          "cf-ipcountry": "de",
        },
        body: JSON.stringify({ json: `{"url":"${secret}"}` }),
      }),
      { params: Promise.resolve({ slug: "json-formatter" }) },
    );
    expect(response.status).toBe(200);
    const events = await settled(store);
    const dumped = JSON.stringify(events);
    expect(dumped).not.toContain(secret);
    expect(dumped).not.toContain("203.0.113.50");
    expect(dumped).not.toContain("198.51.100.8");
    const recorded = events.find((event) => event.kind === "run");
    expect(recorded?.kind).toBe("run");
    if (recorded?.kind === "run") {
      expect(recorded.slug).toBe("json-formatter");
      expect(recorded.source).toBe("api");
      expect(recorded.outcome).toBe("ok");
      expect(recorded.country).toBe("DE");
      expect(recorded.uaFamily).toBe("curl");
      expect(recorded.ipHash).toBe(hashIp("203.0.113.50", salt));
      expect(recorded.inputBytes).toBeGreaterThan(0);
    }
  });

  it("records an MCP call and still rejects a foreign origin", async () => {
    process.env.ANALYTICS_SALT = salt;
    const store = memory();
    const secret = "https://secret.example/mcp-token";
    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "format_json", arguments: { json: `{"url":"${secret}"}` } },
    });
    const response = await handleMcpRequest(
      new Request("https://benchline.fabwaseem.com/mcp", {
        method: "POST",
        headers: {
          host: "benchline.fabwaseem.com",
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          "x-real-ip": "203.0.113.60",
          "user-agent": "benchline-test",
        },
        body,
      }),
    );
    expect(response.status).toBe(200);
    const events = await settled(store);
    const dumped = JSON.stringify(events);
    expect(dumped).not.toContain(secret);
    expect(dumped).not.toContain("203.0.113.60");
    const recorded = events.find((event) => event.kind === "run" && event.slug === "json-formatter");
    expect(recorded?.kind).toBe("run");
    if (recorded?.kind === "run") {
      expect(recorded.source).toBe("mcp");
      expect(recorded.outcome).toBe("ok");
      expect(recorded.ipHash).toBe(hashIp("203.0.113.60", salt));
    }

    const denied = await handleMcpRequest(
      new Request("https://benchline.fabwaseem.com/mcp", {
        method: "POST",
        headers: {
          host: "benchline.fabwaseem.com",
          origin: "https://evil.example",
          "content-type": "application/json",
          "x-real-ip": "203.0.113.61",
        },
        body,
      }),
    );
    expect(denied.status).toBe(403);
    const payload = (await denied.json()) as { error: { message: string } };
    expect(payload.error.message).toBe("Origin is not allowed.");
    await flushAnalytics();
    expect(store.events().some((event) => event.kind === "run" && event.errorCode === "origin")).toBe(true);
  });
});
