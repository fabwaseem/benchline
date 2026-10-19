import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { legacyHostRedirect } from "@/lib/net/legacy-host";
import { proxy } from "@/proxy";

describe("legacyHostRedirect", () => {
  it("redirects the legacy host and keeps the path and query", () => {
    expect(legacyHostRedirect("tools.fabwaseem.com", "/", "?x=1")?.href).toBe("https://benchline.fabwaseem.com/?x=1");
    expect(legacyHostRedirect("Tools.Fabwaseem.com:8443", "/api/v1/tools/jwt-decoder", "")?.href).toBe(
      "https://benchline.fabwaseem.com/api/v1/tools/jwt-decoder",
    );
    expect(legacyHostRedirect("tools.fabwaseem.com:443", "/_next/static/chunk.js", "?v=1")?.href).toBe(
      "https://benchline.fabwaseem.com/_next/static/chunk.js?v=1",
    );
    expect(legacyHostRedirect("tools.fabwaseem.com", "/mcp-docs", "")?.href).toBe("https://benchline.fabwaseem.com/mcp-docs");
    expect(legacyHostRedirect("tools.fabwaseem.com", "/mcpfoo", "")?.href).toBe("https://benchline.fabwaseem.com/mcpfoo");
  });

  it("leaves the MCP paths and other hosts alone", () => {
    expect(legacyHostRedirect("tools.fabwaseem.com", "/mcp", "?x=1")).toBeNull();
    expect(legacyHostRedirect("tools.fabwaseem.com", "/mcp/", "")).toBeNull();
    expect(legacyHostRedirect("Tools.Fabwaseem.com:443", "/mcp/x", "")).toBeNull();
    expect(legacyHostRedirect("benchline.fabwaseem.com", "/mcp", "")).toBeNull();
    expect(legacyHostRedirect("example.com:443", "/", "?q=1")).toBeNull();
    expect(legacyHostRedirect(null, "/mcp", "")).toBeNull();
    expect(legacyHostRedirect("  ", "/mcp", "")).toBeNull();
  });
});

function toolsRequest(pathname: string, method = "POST") {
  return proxy(
    new NextRequest(`https://tools.fabwaseem.com${pathname}`, {
      method,
      headers: { host: "Tools.Fabwaseem.com:443", accept: "text/html, application/json" },
    }),
  );
}

function passesThrough(response: Response) {
  expect(response.status).toBe(200);
  expect(response.headers.get("location")).toBeNull();
  expect(response.headers.get("x-middleware-rewrite")).toBeNull();
}

describe("proxy", () => {
  it("lets MCP paths on the legacy host through", () => {
    passesThrough(toolsRequest("/mcp"));
    passesThrough(toolsRequest("/mcp/"));
    passesThrough(toolsRequest("/mcp/x"));
    passesThrough(toolsRequest("/mcp", "GET"));
  });

  it("still redirects every other legacy path", () => {
    for (const pathname of ["/", "/tools/foo", "/mcp-docs", "/mcpfoo"]) {
      const response = toolsRequest(pathname);
      expect(response.status).toBe(308);
      expect(response.headers.get("location")).toBe(`https://benchline.fabwaseem.com${pathname}`);
    }
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

  it("redirects admin off the legacy host and marks it noindex", () => {
    const legacy = toolsRequest("/admin");
    expect(legacy.status).toBe(308);
    expect(legacy.headers.get("location")).toBe("https://benchline.fabwaseem.com/admin");
    const local = proxy(
      new NextRequest("https://benchline.fabwaseem.com/admin/tools", {
        headers: { host: "benchline.fabwaseem.com" },
      }),
    );
    expect(local.headers.get("x-robots-tag")).toContain("noindex");
    expect(local.headers.get("cache-control")).toContain("no-store");
  });

  it("leaves the canonical host alone", () => {
    for (const pathname of ["/", "/tools/foo", "/mcp-docs", "/mcpfoo"]) {
      passesThrough(
        proxy(
          new NextRequest(`https://benchline.fabwaseem.com${pathname}`, {
            method: "POST",
            headers: { host: "benchline.fabwaseem.com" },
          }),
        ),
      );
    }
  });
});
