import { afterAll, describe, expect, it } from "vitest";
import { createPostgresStore, openDatabase } from "@/lib/analytics/db";
import type { ToolRunEvent } from "@/lib/analytics/types";

const url = process.env.DATABASE_URL;
const probe = `probe-${Date.now()}`;

describe.skipIf(!url)("postgres analytics", () => {
  const sql = openDatabase(url ?? "postgres://unused");

  afterAll(async () => {
    await sql`delete from tool_runs where slug = ${probe}`.catch(() => undefined);
    await sql.end({ timeout: 5 });
  });

  it("migrates, writes a run, and reads it back", async () => {
    const store = createPostgresStore(sql);
    await store.migrate();
    await store.migrate();
    const event: ToolRunEvent = {
      kind: "run",
      ts: new Date().toISOString(),
      slug: probe,
      source: "web",
      outcome: "ok",
      errorCode: null,
      durationMs: 25,
      inputBytes: 4,
      outputBytes: 4,
      ipHash: "abc123",
      country: "US",
      uaFamily: "chrome",
      referrerHost: "example.com",
      visitorId: null,
      sessionId: null,
      mcpSessionId: null,
      mcpClientName: null,
      mcpClientVersion: null,
      mcpProtocol: null,
      mcpHost: null,
    };
    await store.write([event]);
    const report = await store.stats({
      from: new Date(Date.now() - 60_000),
      to: new Date(Date.now() + 60_000),
      slug: probe,
      source: "web",
    });
    expect(report.runs).toBe(1);
    expect(report.duration.p50).toBe(25);
    expect(report.topCountries[0]?.country).toBe("US");
    expect(JSON.stringify(report)).not.toContain("postgres://");
  });
});
