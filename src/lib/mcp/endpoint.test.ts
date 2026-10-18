import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { PDFDocument } from "pdf-lib";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { encodeBase64 } from "@/lib/base64";
import { handleMcpRequest } from "@/lib/mcp/handler";
import { outboundTransport } from "@/lib/net/outbound";
import { resetRateLimit } from "@/lib/net/rate-limit";
import { mcpTools } from "@/registry/mcp-registry";

vi.mock("@/tools/ssl-checker/lib/socket", () => ({
  openTls: () => {
    const listeners = new Map<string, Array<() => void>>();
    const certificate = {
      subject: { CN: "1.1.1.1" },
      issuer: { CN: "Benchline Test" },
      subjectaltname: "IP Address:1.1.1.1",
      valid_from: "Jan 1 00:00:00 2026 GMT",
      valid_to: "Jan 1 00:00:00 2028 GMT",
      fingerprint256: "AA:BB:CC",
      serialNumber: "01",
      bits: 256,
    };
    const socket = {
      authorized: true,
      authorizationError: "",
      once(event: string, listener: () => void) {
        const list = listeners.get(event) ?? [];
        list.push(listener);
        listeners.set(event, list);
        return socket;
      },
      destroy() {},
      end() {},
      getProtocol() {
        return "TLSv1.3";
      },
      getPeerCertificate() {
        return certificate;
      },
    };
    queueMicrotask(() => {
      for (const listener of listeners.get("secureConnect") ?? []) listener();
    });
    return socket;
  },
}));

const token = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZGEiLCJleHAiOjIwMDAwMDAwMDB9.e30";
const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const page = `<!doctype html><html lang="en"><head><title>Example page title</title>
<meta name="description" content="A public example page used by the Benchline checker for agents.">
<link rel="canonical" href="https://1.1.1.1/">
<meta property="og:title" content="Example page title">
<meta property="og:description" content="A public example page used by the Benchline checker for agents.">
<meta property="og:image" content="https://1.1.1.1/og.png">
</head><body><h1>Example</h1><p>A public example page used by the Benchline checker for agents.</p></body></html>`;

const endpoint = "https://tools.fabwaseem.com/mcp";
let pdf = "";
let client: Client;

async function blankPdf() {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  return encodeBase64(new Uint8Array(await doc.save()));
}

function installFetch() {
  vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.includes("dns-query") || url.includes("dns.google")) {
      const parsed = new URL(url);
      const type = parsed.searchParams.get("type") ?? "A";
      const name = parsed.searchParams.get("name") ?? "example.com";
      const rows: Record<string, { type: number; data: string }> = {
        A: { type: 1, data: "1.1.1.1" },
        AAAA: { type: 28, data: "2606:4700:4700::1111" },
        MX: { type: 15, data: "10 mail.example.com." },
        TXT: { type: 16, data: name.startsWith("_dmarc.") ? '"v=DMARC1; p=reject"' : '"v=spf1 mx ~all"' },
        CNAME: { type: 5, data: "example.com." },
        CAA: { type: 257, data: '0 issue "letsencrypt.org"' },
      };
      const row = rows[type] ?? rows.A;
      const body = JSON.stringify({
        Status: 0,
        Answer: [{ name, type: row?.type ?? 1, TTL: 300, data: row?.data ?? "1.1.1.1" }],
      });
      return new Response(body, { status: 200, headers: { "content-type": "application/dns-json" } });
    }
    if (url.includes(".pdf")) {
      const bytes = Buffer.from(pdf, "base64");
      return new Response(bytes, {
        status: 200,
        headers: { "content-type": "application/pdf", "content-length": String(bytes.byteLength) },
      });
    }
    if (url.includes("robots.txt")) {
      return new Response("User-agent: *\nAllow: /\nSitemap: https://1.1.1.1/sitemap.xml\n", {
        status: 200,
        headers: { "content-type": "text/plain" },
      });
    }
    if (url.includes("sitemap")) {
      return new Response("<urlset><url><loc>https://1.1.1.1/</loc></url></urlset>", {
        status: 200,
        headers: { "content-type": "application/xml" },
      });
    }
    if (url.includes("llms.txt")) {
      return new Response("# Example\n", { status: 200, headers: { "content-type": "text/plain" } });
    }
    return new Response(page, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
  });
  vi.spyOn(outboundTransport, "dispatch").mockImplementation(async (url) => {
    const response = await fetch(url);
    return { status: response.status, headers: response.headers, body: new Uint8Array(await response.arrayBuffer()) };
  });
}

function textOf(result: unknown) {
  if (!result || typeof result !== "object" || !("content" in result) || !Array.isArray(result.content)) return "";
  for (const block of result.content) {
    if (block && typeof block === "object" && "type" in block && block.type === "text" && "text" in block && typeof block.text === "string") {
      return block.text;
    }
  }
  return "";
}

describe("MCP endpoint", () => {
  beforeAll(async () => {
    pdf = await blankPdf();
    installFetch();
    resetRateLimit();
    client = new Client({ name: "benchline-test", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(endpoint), {
      fetch: (url, init) => handleMcpRequest(new Request(url, init)),
    });
    await client.connect(transport);
  });

  afterAll(async () => {
    await client.close();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    resetRateLimit();
  });

  it("lists every registered tool", async () => {
    const listed = await client.listTools();
    const names = listed.tools.map((tool) => tool.name).sort();
    expect(names).toEqual(mcpTools.map((tool) => tool.name).sort());
    for (const tool of listed.tools) {
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  it("calls every tool through the endpoint", async () => {
    const image = { data: png, filename: "dot.png", mimeType: "image/png" };
    const samples: Record<string, Record<string, unknown>> = {
      generate_llms_txt: {
        siteName: "Bench",
        summary: "Tools for the web.",
        pages: [{ url: "https://example.com/docs", title: "Docs" }],
      },
      score_ai_seo: { url: "https://1.1.1.1/" },
      build_open_graph: { template: "editorial", title: "Ship notes" },
      list_og_templates: {},
      decode_jwt: { token },
      check_robots_txt: { url: "https://1.1.1.1/" },
      inspect_meta_tags: { url: "https://1.1.1.1/" },
      build_json_ld: { type: "Organization", values: { name: "Benchline" } },
      count_tokens: { text: "hello world" },
      explain_cron: { expression: "0 9 * * 1", now: "2026-01-05T00:00:00.000Z" },
      build_nextjs_dockerfile: {},
      format_json: { json: "{\"a\":1}" },
      convert_data_format: { text: "{\"a\":1}", to: "yaml" },
      convert_csv_json: { text: "a,b\n1,2" },
      diff_text: { left: "a\n", right: "b\n" },
      base64_codec: { text: "hi" },
      convert_image: { file: image, target: "jpeg" },
      compress_image: { file: image, choice: "jpeg", quality: 60 },
      resize_image: { file: image, width: 4, height: 4, lockAspect: false, fit: "stretch" },
      convert_color: { color: "#336699" },
      convert_unix_timestamp: { input: "0" },
      date_difference: { startDate: "2026-01-01", endDate: "2026-01-10" },
      hash_data: { text: "hello" },
      generate_uuid: { count: 1 },
      url_codec: { value: "https://example.com/a?b=1" },
      generate_password: { length: 12, count: 1 },
      explain_chmod: { mode: "755" },
      merge_pdf: { files: [{ name: "a.pdf", data: pdf }, { name: "b.pdf", data: pdf }] },
      split_pdf: { name: "a.pdf", data: pdf },
      compress_pdf: { data: pdf, preset: "light" },
      images_to_pdf: { images: [image] },
      generate_qr_code: { type: "text", text: "hello" },
      extract_pdf_text: { data: pdf },
      organize_pdf: { data: pdf, pages: [{ source: 1, rotate: 90 }] },
      render_pdf_pages: { data: pdf, format: "png", dpi: 72 },
      protect_pdf: { data: pdf, action: "protect", password: "secret" },
      convert_markdown_html: { text: "# Hi\n", to: "html" },
      fetch_page_markdown: { url: "https://1.1.1.1/" },
      read_barcode: { file: image },
      optimize_svg: { svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"10\" height=\"10\" viewBox=\"0 0 10 10\"><rect width=\"10\" height=\"10\" fill=\"#ffffff\"/></svg>" },
      read_exif: { file: image, action: "read" },
      crop_image: { file: image, x: 0, y: 0, width: 1, height: 1 },
      generate_favicon: { text: "B", background: "#111111", color: "#ffffff" },
      read_image_text: { file: image, language: "eng" },
      remove_background: { file: image, tolerance: 24, feather: false },
      count_text: { text: "Hello world" },
      convert_case: { text: "hello world" },
      generate_fake_data: { mode: "lorem", kind: "words", count: 3, seed: 1 },
      test_regex: { pattern: "a+", text: "baaac" },
      format_sql: { sql: "select a from t" },
      validate_json_schema: { json: "{\"a\":1}" },
      calculate_emi: { principal: "100000", annualRate: "10", months: 12 },
      calculate_percentage: { mode: "of", a: "10", b: "200" },
      convert_units: { category: "length", from: "m", to: "cm", value: "1", precision: 2 },
      lookup_dns: { name: "example.com", resolver: "cloudflare", mail: true },
      calculate_cidr: { cidr: "192.168.1.0/24" },
      hash_password: { password: "correct horse", algorithm: "bcrypt", cost: 4 },
      generate_keypair: { action: "generate", alg: "ES256" },
      build_csp: { policy: "default-src 'none'; object-src 'none'; base-uri 'none'" },
      validate_sitemap: { url: "https://1.1.1.1/sitemap.xml", probe: true },
      check_http_headers: { url: "https://1.1.1.1/" },
      check_ssl: { host: "1.1.1.1" },
      generate_totp: { secret: "JBSWY3DPEHPK3PXP", at: 1000000000000 },
      query_jsonpath: { json: "{\"store\":{\"book\":[{\"title\":\"A\"}]}}", query: "$.store.book[*].title" },
      calculate_programmer: { expression: "0xFF & 0x0F | (1 << 4)" },
      aes_crypt: { mode: "encrypt", passphrase: "test-passphrase", text: "hello" },
      analyze_har: {
        har: "{\"log\":{\"entries\":[{\"startedDateTime\":\"2026-10-18T10:00:00.000Z\",\"time\":100,\"request\":{\"method\":\"GET\",\"url\":\"https://example.com/\"},\"response\":{\"status\":200,\"statusText\":\"OK\",\"content\":{\"size\":10,\"mimeType\":\"text/html\"}},\"timings\":{\"blocked\":1,\"dns\":2,\"connect\":3,\"send\":4,\"wait\":80,\"receive\":10}}]}}",
      },
      convert_json_to_types: { json: "{\"name\":\"Ada\"}", targets: ["typescript"] },
      minify_code: { language: "js", code: "function foo() { return 1; }" },
      convert_curl: { command: "curl https://example.com", target: "fetch" },
      execute_graphql: { endpoint: "https://1.1.1.1/", query: "{ hello }" },
      validate_websocket_url: { url: "wss://echo.example.com/chat" },
    };

    const missing = mcpTools.map((tool) => tool.name).filter((name) => !(name in samples));
    expect(missing).toEqual([]);

    for (const [index, tool] of mcpTools.entries()) {
      if (index % 40 === 0) resetRateLimit();
      const args = samples[tool.name] ?? {};
      let result: Awaited<ReturnType<Client["callTool"]>>;
      try {
        result = await client.callTool({ name: tool.name, arguments: args });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${tool.name} failed: ${message}`);
      }
      expect(result.isError, `${tool.name}: ${textOf(result)}`).not.toBe(true);
      expect(() => tool.outputSchema.parse(result.structuredContent), tool.name).not.toThrow();
    }
  }, 120_000);

  it("fetches a public PDF URL and refuses a private one", async () => {
    resetRateLimit();
    const ok = await client.callTool({ name: "split_pdf", arguments: { url: "https://1.1.1.1/a.pdf" } });
    expect(ok.isError, textOf(ok)).not.toBe(true);
    const blocked = await client.callTool({ name: "split_pdf", arguments: { url: "http://127.0.0.1/secret.pdf" } });
    expect(blocked.isError).toBe(true);
    expect(textOf(blocked)).toMatch(/not public|private|address/i);
  });

  it("rejects an unsupported protocol version and a foreign origin", async () => {
    resetRateLimit();
    const headers = {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    };
    const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
    const version = await handleMcpRequest(new Request(endpoint, {
      method: "POST",
      headers: { ...headers, "mcp-protocol-version": "1999-01-01" },
      body,
    }));
    expect(version.status).toBe(400);
    const origin = await handleMcpRequest(new Request(endpoint, {
      method: "POST",
      headers: { ...headers, origin: "https://evil.example" },
      body,
    }));
    expect(origin.status).toBe(403);
  });
});
