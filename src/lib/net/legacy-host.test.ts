import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { legacyHostRedirect } from "@/lib/net/legacy-host";
import { proxy } from "@/proxy";

describe("legacyHostRedirect", () => {
  it("redirects the legacy host and keeps the path and query", () => {
    expect(legacyHostRedirect("tools.fabwaseem.com", "/mcp", "?x=1")?.href).toBe("https://benchline.fabwaseem.com/mcp?x=1");
    expect(legacyHostRedirect("Tools.Fabwaseem.com:8443", "/api/v1/tools/jwt-decoder", "")?.href).toBe(
      "https://benchline.fabwaseem.com/api/v1/tools/jwt-decoder",
    );
    expect(legacyHostRedirect("tools.fabwaseem.com:443", "/_next/static/chunk.js", "?v=1")?.href).toBe(
      "https://benchline.fabwaseem.com/_next/static/chunk.js?v=1",
    );
  });

  it("leaves other hosts alone", () => {
    expect(legacyHostRedirect("benchline.fabwaseem.com", "/mcp", "")).toBeNull();
    expect(legacyHostRedirect("example.com:443", "/", "?q=1")).toBeNull();
    expect(legacyHostRedirect(null, "/mcp", "")).toBeNull();
    expect(legacyHostRedirect("  ", "/mcp", "")).toBeNull();
  });
});

describe("proxy", () => {
  it("returns a 308 for the legacy host and keeps the method-preserving status", () => {
    const legacy = proxy(
      new NextRequest("https://tools.fabwaseem.com/mcp?x=1", {
        method: "POST",
        headers: { host: "Tools.Fabwaseem.com:443" },
      }),
    );
    expect(legacy.status).toBe(308);
    expect(legacy.headers.get("location")).toBe("https://benchline.fabwaseem.com/mcp?x=1");
  });

  it("keeps the MCP guide rewrite for the new host", () => {
    const guide = proxy(
      new NextRequest("https://benchline.fabwaseem.com/mcp", {
        method: "GET",
        headers: { host: "benchline.fabwaseem.com", accept: "text/html" },
      }),
    );
    expect(guide.status).toBe(200);
    expect(guide.headers.get("x-middleware-rewrite") ?? guide.headers.get("location")).toContain("/mcp/guide");

    const post = proxy(
      new NextRequest("https://benchline.fabwaseem.com/mcp", {
        method: "POST",
        headers: { host: "benchline.fabwaseem.com", accept: "text/html" },
      }),
    );
    expect(post.status).toBe(200);
    expect(post.headers.get("location")).toBeNull();
    expect(post.headers.get("x-middleware-rewrite")).toBeNull();
  });
});
