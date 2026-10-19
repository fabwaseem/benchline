import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, connection: async () => undefined };
});

import { GET } from "@/app/api/health/route";
import { createMemoryStore } from "@/lib/analytics/memory";
import { analyticsRuntime } from "@/lib/analytics/global";
import { enqueue, flushAnalytics, resetAnalyticsForTests, setAnalyticsStore, shutdownAnalytics } from "@/lib/analytics/store";
import type { ToolRunEvent } from "@/lib/analytics/types";
import { applyServerTimeouts, createShutdown, exitWithCode, HEADERS_TIMEOUT_MS, KEEP_ALIVE_TIMEOUT_MS, parseDrainMs, type ClosableServer } from "@/lib/shutdown/graceful";
import { installGracefulShutdown } from "@/lib/shutdown/install";
import { clearDrainingForTests, inflightRequests, isDraining, markDraining, registerShutdownCleanup, runShutdownCleanup } from "@/lib/shutdown/state";

const HANDLE = Symbol.for("benchline.shutdown.handle");
const LISTENING = Symbol.for("benchline.shutdown.listening");
const SERVERS = Symbol.for("benchline.http.servers");
const INFLIGHT = Symbol.for("benchline.http.inflight");

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

afterEach(() => {
  vi.useRealTimers();
  clearDrainingForTests();
  resetAnalyticsForTests();
  const slot = globalThis as typeof globalThis & {
    [HANDLE]?: unknown;
    [LISTENING]?: unknown;
    [SERVERS]?: unknown;
    [INFLIGHT]?: unknown;
  };
  delete slot[HANDLE];
  delete slot[LISTENING];
  delete slot[SERVERS];
  delete slot[INFLIGHT];
});

describe("health", () => {
  it("returns ok until the process is draining", async () => {
    const ok = await GET();
    expect(ok.status).toBe(200);
    expect(ok.headers.get("cache-control")).toBe("no-store");
    expect(await ok.json()).toEqual({ status: "ok" });
    markDraining();
    expect(isDraining()).toBe(true);
    const draining = await GET();
    expect(draining.status).toBe(503);
    expect(draining.headers.get("cache-control")).toBe("no-store");
    expect(await draining.json()).toEqual({ status: "draining" });
  });
});

describe("parseDrainMs", () => {
  it("defaults to 9s and keeps a gap before the force exit", () => {
    expect(parseDrainMs(undefined)).toBe(9_000);
    expect(parseDrainMs("")).toBe(9_000);
    expect(parseDrainMs("nope")).toBe(9_000);
    expect(parseDrainMs("-1")).toBe(9_000);
    expect(parseDrainMs("0")).toBe(0);
    expect(parseDrainMs("2500")).toBe(2_500);
    expect(parseDrainMs("90000")).toBe(24_000);
  });
});

describe("graceful shutdown", () => {
  it("keeps serving through the drain, then closes idle sockets, cleans up, and exits 0", async () => {
    vi.useFakeTimers();
    const order: string[] = [];
    let release: (() => void) | undefined;
    const server: ClosableServer = {
      close(callback) {
        order.push("close");
        release = () => {
          order.push("closed");
          callback();
        };
      },
      closeIdleConnections() {
        order.push("idle");
      },
      closeAllConnections() {
        order.push("closeAll");
      },
    };
    const slot = globalThis as typeof globalThis & { [INFLIGHT]?: number };
    slot[INFLIGHT] = 2;
    const shutdown = createShutdown({
      drainMs: 9_000,
      servers: () => [server],
      cleanup: async () => {
        order.push("cleanup");
      },
      exit: (code) => {
        order.push(`exit:${code}`);
      },
      setTimeout,
      clearTimeout,
      log: (message) => {
        order.push(message);
      },
    });
    shutdown("SIGTERM");
    shutdown("SIGINT");
    expect(isDraining()).toBe(true);
    expect(inflightRequests()).toBe(2);
    await vi.advanceTimersByTimeAsync(8_999);
    expect(order).toEqual(["[shutdown] SIGTERM: draining for 9000ms"]);
    await vi.advanceTimersByTimeAsync(1);
    expect(order).toEqual(["[shutdown] SIGTERM: draining for 9000ms", "closing server", "idle", "close"]);
    expect(release).toBeTypeOf("function");
    release?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(order).toEqual([
      "[shutdown] SIGTERM: draining for 9000ms",
      "closing server",
      "idle",
      "close",
      "closed",
      "closed, in-flight=2",
      "cleanup",
      "exiting 0",
      "exit:0",
    ]);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(order).not.toContain("closeAll");
  });

  it("drops remaining sockets after 5s and force-exits at 25s", async () => {
    vi.useFakeTimers();
    const order: string[] = [];
    const server: ClosableServer = {
      close() {
        order.push("close");
      },
      closeIdleConnections() {
        order.push("idle");
      },
      closeAllConnections() {
        order.push("closeAll");
      },
    };
    const shutdown = createShutdown({
      drainMs: 9_000,
      servers: () => [server],
      cleanup: async () => {
        order.push("cleanup");
      },
      exit: (code) => {
        order.push(`exit:${code}`);
      },
      setTimeout,
      clearTimeout,
      log: (message) => {
        order.push(message);
      },
    });
    shutdown("SIGTERM");
    await vi.advanceTimersByTimeAsync(9_000);
    expect(order).toEqual(["[shutdown] SIGTERM: draining for 9000ms", "closing server", "idle", "close"]);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(order).toEqual(["[shutdown] SIGTERM: draining for 9000ms", "closing server", "idle", "close", "closeAll"]);
    await vi.advanceTimersByTimeAsync(11_000);
    expect(order).toEqual([
      "[shutdown] SIGTERM: draining for 9000ms",
      "closing server",
      "idle",
      "close",
      "closeAll",
      "exiting 0",
      "exit:0",
    ]);
  });

  it("sets keep-alive above a 60s proxy idle timeout", () => {
    const server: ClosableServer = {
      close() {
        return undefined;
      },
      keepAliveTimeout: 5_000,
      headersTimeout: 60_000,
    };
    applyServerTimeouts(server);
    expect(server.headersTimeout).toBe(HEADERS_TIMEOUT_MS);
    expect(server.keepAliveTimeout).toBe(KEEP_ALIVE_TIMEOUT_MS);
    expect(server.headersTimeout).toBeGreaterThan(server.keepAliveTimeout ?? 0);
  });

  it("flushes stdout and exits with process.exitCode", () => {
    const previous = process.exitCode;
    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(((
      _chunk: string | Uint8Array,
      encoding?: BufferEncoding | ((error?: Error | null) => void),
      cb?: (error?: Error | null) => void,
    ) => {
      const callback = typeof encoding === "function" ? encoding : cb;
      callback?.();
      return true;
    }) as typeof process.stdout.write);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(((
      _chunk: string | Uint8Array,
      encoding?: BufferEncoding | ((error?: Error | null) => void),
      cb?: (error?: Error | null) => void,
    ) => {
      const callback = typeof encoding === "function" ? encoding : cb;
      callback?.();
      return true;
    }) as typeof process.stderr.write);
    exitWithCode(0);
    expect(process.exitCode).toBe(0);
    expect(stdout).toHaveBeenCalled();
    expect(stderr).toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith();
    exit.mockRestore();
    stdout.mockRestore();
    stderr.mockRestore();
    process.exitCode = previous;
  });

  it("runs registered cleanups", async () => {
    const calls: string[] = [];
    const stop = registerShutdownCleanup(async () => {
      calls.push("a");
    });
    registerShutdownCleanup(async () => {
      calls.push("b");
    });
    await runShutdownCleanup();
    stop();
    await runShutdownCleanup();
    expect(calls).toEqual(["a", "b", "b"]);
  });

  it("flushes the analytics queue and ends the pool", async () => {
    const store = createMemoryStore();
    setAnalyticsStore(store);
    enqueue(run());
    const ended = vi.fn(async () => undefined);
    analyticsRuntime().sql = { end: ended };
    const timer = setInterval(() => undefined, 60_000);
    analyticsRuntime().retainTimer = timer;
    await shutdownAnalytics();
    expect(store.events()).toHaveLength(1);
    expect(ended).toHaveBeenCalledWith({ timeout: 2 });
    expect(analyticsRuntime().sql).toBeNull();
    expect(analyticsRuntime().retainTimer).toBeNull();
    await flushAnalytics();
  });

  it("delegates to the entry listener instead of adding another", () => {
    const server: ClosableServer = {
      close() {
        return undefined;
      },
      keepAliveTimeout: 5_000,
      headersTimeout: 60_000,
    };
    const slot = globalThis as typeof globalThis & {
      [LISTENING]?: boolean;
      [HANDLE]?: unknown;
      [SERVERS]?: Set<unknown>;
    };
    slot[LISTENING] = true;
    slot[SERVERS] = new Set([server]);
    installGracefulShutdown();
    expect(typeof slot[HANDLE]).toBe("function");
    expect(server.keepAliveTimeout).toBe(KEEP_ALIVE_TIMEOUT_MS);
    expect(server.headersTimeout).toBe(HEADERS_TIMEOUT_MS);
    expect(process.listeners("SIGTERM").some((listener) => listener.name === "shutdown")).toBe(false);
  });
});
