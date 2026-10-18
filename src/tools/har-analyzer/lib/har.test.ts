import { describe, expect, it } from "vitest";
import { analyzeHarText, formatBytes, formatDuration } from "@/tools/har-analyzer/lib/har";

function har(entries: unknown[]) {
  return JSON.stringify({ log: { version: "1.2", entries } });
}

function entry(overrides: Record<string, unknown> = {}) {
  return {
    startedDateTime: "2026-10-18T10:00:00.000Z",
    time: 120,
    request: { method: "get", url: "https://example.com/app.js" },
    response: {
      status: 200,
      statusText: "OK",
      content: { size: 1024, mimeType: "application/javascript" },
    },
    timings: { blocked: 5, dns: 10, connect: 20, send: 5, wait: 70, receive: 10 },
    ...overrides,
  };
}

describe("HAR analyzer", () => {
  it("parses entries and computes the summary", () => {
    const analysis = analyzeHarText(
      har([
        entry(),
        entry({ time: 900, request: { method: "POST", url: "https://example.com/api" }, response: { status: 500, statusText: "Error", content: { size: 2048, mimeType: "application/json" } } }),
        entry({ time: 50, request: { method: "GET", url: "https://cdn.example.com/x.css" }, response: { status: 301, statusText: "Moved", content: { size: 0, mimeType: "text/css" } } }),
      ]),
    );
    if ("error" in analysis) throw new Error(analysis.error);
    expect(analysis.summary.totalRequests).toBe(3);
    expect(analysis.summary.totalBytes).toBe(3072);
    expect(analysis.summary.statusGroups).toMatchObject({ "2xx": 1, "3xx": 1, "5xx": 1, "4xx": 0 });
    expect(analysis.summary.slowest[0]?.timeMs).toBe(900);
    expect(analysis.summary.largest[0]?.sizeBytes).toBe(2048);
    expect(analysis.summary.topHosts[0]).toMatchObject({ host: "example.com", requests: 2 });
    expect(analysis.entries[0]).toMatchObject({ method: "GET", host: "example.com", timings: { wait: 70 } });
  });

  it("treats -1 timings as zero and falls back to bodySize", () => {
    const analysis = analyzeHarText(
      har([
        entry({
          timings: { blocked: -1, dns: -1, send: 1, wait: 2, receive: 3 },
          response: { status: 200, statusText: "", content: { size: -1, mimeType: "text/html" }, bodySize: 512 },
        }),
      ]),
    );
    if ("error" in analysis) throw new Error(analysis.error);
    expect(analysis.entries[0]?.timings.blocked).toBe(0);
    expect(analysis.entries[0]?.sizeBytes).toBe(512);
  });

  it("skips entries without a URL and rejects bad input", () => {
    const withBad = analyzeHarText(har([entry(), { time: 5 }]));
    if ("error" in withBad) throw new Error(withBad.error);
    expect(withBad.summary.totalRequests).toBe(1);
    expect(analyzeHarText("")).toMatchObject({ error: expect.any(String) });
    expect(analyzeHarText("{oops")).toMatchObject({ error: expect.stringContaining("valid JSON") });
    expect(analyzeHarText(JSON.stringify({ entries: [] }))).toMatchObject({ error: expect.stringContaining("log.entries") });
    expect(analyzeHarText(har([]))).toMatchObject({ error: expect.stringContaining("no usable entries") });
  });

  it("formats bytes and durations", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
    expect(formatDuration(450)).toBe("450 ms");
    expect(formatDuration(1500)).toBe("1.5 s");
  });
});
