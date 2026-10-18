import { describe, expect, it, vi } from "vitest";
import { executeGraphql, parseVariables, pushHistory, validateEndpoint } from "./graphql";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } });
}

describe("validateEndpoint", () => {
  it("accepts https URLs", () => {
    expect("url" in validateEndpoint("https://example.com/graphql")).toBe(true);
  });

  it("rejects non-http schemes", () => {
    const result = validateEndpoint("ws://example.com");
    expect("error" in result).toBe(true);
  });

  it("rejects garbage", () => {
    const result = validateEndpoint("not a url");
    expect("error" in result).toBe(true);
  });
});

describe("parseVariables", () => {
  it("parses JSON variables", () => {
    const result = parseVariables('{"a":1}');
    expect("error" in result).toBe(false);
  });

  it("treats blank as absent", () => {
    const result = parseVariables("  ");
    expect(result).toEqual({ variables: undefined });
  });

  it("rejects invalid JSON", () => {
    expect("error" in parseVariables("{oops")).toBe(true);
  });
});

describe("executeGraphql", () => {
  it("returns data on success", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ data: { hello: "world" } }));
    const result = await executeGraphql({ endpoint: "https://example.com/graphql", query: "{ hello }" }, fetchImpl as typeof fetch);
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ hello: "world" });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("surfaces graphql errors without throwing", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ errors: [{ message: "bad query" }] }));
    const result = await executeGraphql({ endpoint: "https://example.com/graphql", query: "{ bad }" }, fetchImpl as typeof fetch);
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([{ message: "bad query" }]);
  });

  it("handles non-JSON bodies gracefully", async () => {
    const fetchImpl = vi.fn(async () => new Response("<html></html>", { status: 200 }));
    const result = await executeGraphql({ endpoint: "https://example.com/graphql", query: "{ hello }" }, fetchImpl as typeof fetch);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("non-JSON");
  });

  it("returns a timeout error instead of throwing", async () => {
    const fetchImpl = vi.fn(async (_url: unknown, init?: { signal?: AbortSignal }) => {
      await new Promise((_, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      });
      return jsonResponse({});
    });
    const result = await executeGraphql(
      { endpoint: "https://example.com/graphql", query: "{ hello }", timeoutMs: 1000 },
      fetchImpl as unknown as typeof fetch,
    );
    expect(result.ok).toBe(false);
    expect(result.error).toContain("timed out");
  });

  it("throws on an empty query", async () => {
    const fetchImpl = vi.fn();
    await expect(executeGraphql({ endpoint: "https://example.com/graphql", query: "  " }, fetchImpl as typeof fetch)).rejects.toThrow();
  });
});

describe("pushHistory", () => {
  it("prepends and dedupes", () => {
    const once = pushHistory([], "https://a.example", "{ x }");
    const twice = pushHistory(once, "https://a.example", "{ x }");
    expect(twice).toHaveLength(1);
    const thrice = pushHistory(twice, "https://b.example", "{ y }");
    expect(thrice).toHaveLength(2);
    expect(thrice[0]?.endpoint).toBe("https://b.example");
  });

  it("caps at 20 entries", () => {
    let entries: ReturnType<typeof pushHistory> = [];
    for (let i = 0; i < 25; i += 1) entries = pushHistory(entries, `https://e${i}.example`, "{ x }");
    expect(entries).toHaveLength(20);
  });
});
