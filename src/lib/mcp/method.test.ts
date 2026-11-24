import { describe, expect, it } from "vitest";
import { mcpMethodNotAllowed } from "@/lib/mcp/method";

describe("mcpMethodNotAllowed", () => {
  it("keeps the spec's 405 and Allow: POST", () => {
    const response = mcpMethodNotAllowed();
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("tells an agent where the docs are and how to call", async () => {
    const response = mcpMethodNotAllowed();
    const body = await response.text();
    expect(body).toContain("Send requests with POST");
    expect(body).toContain("/mcp/guide");
    expect(body).toContain("/llms.txt");
    expect(body).toContain('"method":"tools/list"');
  });

  it("links the guide, llms.txt, and OpenAPI in the Link header", () => {
    const link = mcpMethodNotAllowed().headers.get("link") ?? "";
    expect(link).toContain('/mcp/guide>; rel="help"');
    expect(link).toContain('/llms.txt>; rel="describedby"');
    expect(link).toContain('/openapi.json>; rel="service-desc"');
  });
});
