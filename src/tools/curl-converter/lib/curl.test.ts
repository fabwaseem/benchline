import { describe, expect, it } from "vitest";
import { convertCurl, exampleCurl, generateSnippet, parseCurl } from "./curl";

describe("parseCurl", () => {
  it("parses the example command", () => {
    const parsed = parseCurl(exampleCurl);
    expect("error" in parsed).toBe(false);
    if ("error" in parsed) return;
    expect(parsed.request.method).toBe("POST");
    expect(parsed.request.url).toBe("https://api.example.com/v1/items");
    expect(parsed.request.headers).toContainEqual({ name: "Content-Type", value: "application/json" });
    expect(parsed.request.body).toBe('{"name":"widget","qty":3}');
  });

  it("infers GET without a body", () => {
    const parsed = parseCurl("curl https://example.com");
    expect("error" in parsed).toBe(false);
    if ("error" in parsed) return;
    expect(parsed.request.method).toBe("GET");
  });

  it("handles single quotes, flags, and auth", () => {
    const parsed = parseCurl("curl -u 'ada:secret' -k -L -H 'X-A: 1' https://example.com");
    expect("error" in parsed).toBe(false);
    if ("error" in parsed) return;
    expect(parsed.request.user).toBe("ada:secret");
    expect(parsed.request.insecure).toBe(true);
    expect(parsed.request.followRedirects).toBe(true);
    expect(parsed.request.headers).toContainEqual({ name: "X-A", value: "1" });
  });

  it("rejects non-curl commands", () => {
    expect("error" in parseCurl("wget https://example.com")).toBe(true);
  });

  it("rejects unterminated quotes", () => {
    expect("error" in parseCurl("curl 'https://example.com")).toBe(true);
  });
});

describe("generateSnippet", () => {
  const parsed = parseCurl(exampleCurl);
  if ("error" in parsed) throw new Error("example failed to parse");

  it("generates fetch", () => {
    const code = generateSnippet("fetch", parsed.request);
    expect(code).toContain('fetch("https://api.example.com/v1/items"');
    expect(code).toContain('method: "POST"');
    expect(code).toContain("await res.json()");
  });

  it("generates python", () => {
    const code = generateSnippet("python", parsed.request);
    expect(code).toContain("import requests");
    expect(code).toContain("requests.post(");
  });

  it("generates go", () => {
    const code = generateSnippet("go", parsed.request);
    expect(code).toContain("http.NewRequest");
    expect(code).toContain("req.Header.Set");
  });

  it("generates php", () => {
    const code = generateSnippet("php", parsed.request);
    expect(code).toContain("curl_init(");
    expect(code).toContain("CURLOPT_POSTFIELDS");
  });

  it("generates rust", () => {
    const code = generateSnippet("rust", parsed.request);
    expect(code).toContain("reqwest::Client::new()");
    expect(code).toContain(".post(");
  });
});

describe("convertCurl", () => {
  it("converts end to end", () => {
    const result = convertCurl(exampleCurl, "python");
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.snippet).toContain("requests.post(");
    expect(result.request.url).toBe("https://api.example.com/v1/items");
  });
});
