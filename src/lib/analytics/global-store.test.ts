import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryStore } from "@/lib/analytics/memory";
import type { ToolRunEvent } from "@/lib/analytics/types";

function run(): ToolRunEvent {
  return {
    kind: "run",
    ts: "2026-06-01T12:00:00.000Z",
    slug: "json-formatter",
    source: "web",
    outcome: "ok",
    errorCode: null,
    durationMs: 10,
    inputBytes: 2,
    outputBytes: 2,
    ipHash: null,
    country: null,
    uaFamily: null,
    referrerHost: null,
    visitorId: null,
    sessionId: null,
    mcpSessionId: null,
    mcpClientName: null,
    mcpClientVersion: null,
    mcpProtocol: null,
    mcpHost: null,
  };
}

async function loadStore() {
  return import("@/lib/analytics/store");
}

describe("analytics global store", () => {
  afterEach(async () => {
    vi.doUnmock("@/lib/analytics/db");
    delete process.env.DATABASE_URL;
    delete process.env.ANALYTICS_SALT;
    const store = await loadStore();
    store.resetAnalyticsForTests();
    vi.resetModules();
  });

  it("shares the store across separate module graphs", async () => {
    vi.resetModules();
    const first = await loadStore();
    const memory = createMemoryStore();
    first.setAnalyticsStore(memory);
    vi.resetModules();
    const second = await loadStore();
    expect(await second.getAnalyticsStore()).toBe(memory);
    second.enqueue(run());
    await second.flushAnalytics();
    expect(memory.events()).toHaveLength(1);
    expect(await first.getAnalyticsStore()).toBe(memory);
  });

  it("opens the database on first use when startup never ran", async () => {
    let migrated = 0;
    let opened = 0;
    let writes = 0;
    vi.doMock("@/lib/analytics/db", () => ({
      openDatabase: () => {
        opened += 1;
        return { end: async () => undefined };
      },
      createPostgresStore: () => ({
        async migrate() {
          migrated += 1;
        },
        async write() {
          writes += 1;
        },
        async stats() {
          return {};
        },
        async retain() {},
      }),
    }));
    vi.resetModules();
    process.env.DATABASE_URL = "postgres://bench:bench@127.0.0.1:5432/bench";
    const store = await loadStore();
    const first = await store.getAnalyticsStore();
    const second = await store.getAnalyticsStore();
    expect(first).toBeTruthy();
    expect(second).toBe(first);
    expect(opened).toBe(1);
    expect(migrated).toBe(1);
    store.enqueue(run());
    await store.flushAnalytics();
    expect(writes).toBe(1);
    expect(migrated).toBe(1);
  });

  it("logs a dropped event once while the database is configured but unavailable", async () => {
    vi.doMock("@/lib/analytics/db", () => ({
      openDatabase: () => ({ end: async () => undefined }),
      createPostgresStore: () => ({
        async migrate() {
          throw new Error("connect failed");
        },
        async write() {},
        async stats() {
          return {};
        },
        async retain() {},
      }),
    }));
    vi.resetModules();
    process.env.DATABASE_URL = "postgres://bench:bench@127.0.0.1:5432/bench";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const store = await loadStore();
    store.enqueue(run());
    await store.flushAnalytics();
    store.enqueue(run());
    await store.flushAnalytics();
    const drops = warn.mock.calls.filter((args) => String(args[0]).includes("dropping events"));
    expect(drops).toHaveLength(1);
    expect(String(drops[0]?.[0])).toContain("DATABASE_URL is set");
    warn.mockRestore();
  });
});
