import { describe, expect, it } from "vitest";
import { decodeUrl, encodeUrl, parseQuery, parseUrl, replaceQuery, serializeQuery, withUtm } from "@/tools/url-codec/lib/url";

describe("url codec", () => {
  it("encodes a component without touching a full URL's reserved characters", () => {
    expect(encodeUrl("a b/c?", "component")).toBe("a%20b%2Fc%3F");
    expect(encodeUrl("https://example.com/a b", "full")).toBe("https://example.com/a%20b");
    expect(decodeUrl("a%20b%2F", false)).toEqual({ value: "a b/" });
    expect(decodeUrl("a+b", true)).toEqual({ value: "a b" });
    expect(decodeUrl("%", false)).toHaveProperty("error");
  });

  it("parses a URL and a raw query, then rebuilds them", () => {
    const parsed = parseUrl("https://ada:secret@example.com:8443/docs?q=a+b&x=1#top");
    expect("error" in parsed).toBe(false);
    if ("error" in parsed) return;
    expect(parsed.hostname).toBe("example.com");
    expect(parsed.port).toBe("8443");
    expect(parsed.username).toBe("ada");
    expect(parsed.pathname).toBe("/docs");
    expect(parsed.hash).toBe("#top");
    expect(parsed.params).toEqual([{ key: "q", value: "a b" }, { key: "x", value: "1" }]);
    expect(parseQuery("?q=a+b&x=1")).toEqual(parsed.params);
    const next = withUtm(parsed.params, { utm_source: "bench", utm_medium: "tool" });
    expect(serializeQuery(next)).toBe("q=a%20b&x=1&utm_source=bench&utm_medium=tool");
    expect(replaceQuery("example.com/docs?q=1", next)).toBe("example.com/docs?q=a%20b&x=1&utm_source=bench&utm_medium=tool");
  });
});
