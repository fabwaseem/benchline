import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { PDFDocument } from "pdf-lib";

const endpoint = process.env.MCP_URL ?? "https://tools.fabwaseem.com/mcp";
const token = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZGEiLCJleHAiOjIwMDAwMDAwMDB9.e30";
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function blankPdf() {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  const bytes = await doc.save();
  return Buffer.from(bytes).toString("base64");
}

function textOf(result: unknown) {
  if (!result || typeof result !== "object" || !("content" in result) || !Array.isArray(result.content)) {
    return "";
  }
  for (const block of result.content) {
    if (
      block &&
      typeof block === "object" &&
      "type" in block &&
      block.type === "text" &&
      "text" in block &&
      typeof block.text === "string"
    ) {
      return block.text;
    }
  }
  return "";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 6): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable = /429|Too many requests|rate/i.test(message);
      if (!retryable || i === attempts - 1) throw error;
      const wait = Math.min(65_000, 5_000 * (i + 1));
      console.error(`[retry] ${label}: ${message}; waiting ${wait}ms`);
      await sleep(wait);
    }
  }
  throw last;
}

async function main() {
  const pdf = await blankPdf();
  const image = { data: png, filename: "dot.png", mimeType: "image/png" };
  const samples: Record<string, Record<string, unknown>> = {
    generate_llms_txt: {
      siteName: "Bench",
      summary: "Tools for the web.",
      pages: [{ url: "https://example.com/docs", title: "Docs" }],
    },
    score_ai_seo: { url: "https://example.com/" },
    build_open_graph: { template: "editorial", title: "Ship notes" },
    list_og_templates: {},
    decode_jwt: { token },
    check_robots_txt: { url: "https://example.com/" },
    inspect_meta_tags: { url: "https://example.com/" },
    build_json_ld: { type: "Organization", values: { name: "Benchline" } },
    count_tokens: { text: "hello world" },
    explain_cron: { expression: "0 9 * * 1", now: "2026-01-05T00:00:00.000Z" },
    build_nextjs_dockerfile: {},
    format_json: { json: '{"a":1}' },
    convert_data_format: { text: '{"a":1}', to: "yaml" },
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
    merge_pdf: {
      files: [
        { name: "a.pdf", data: pdf },
        { name: "b.pdf", data: pdf },
      ],
    },
    split_pdf: { name: "a.pdf", data: pdf },
    compress_pdf: { data: pdf, preset: "light" },
    images_to_pdf: { images: [image] },
    generate_qr_code: { type: "text", text: "hello" },
    extract_pdf_text: { data: pdf },
    organize_pdf: { data: pdf, pages: [{ source: 1, rotate: 90 }] },
    render_pdf_pages: { data: pdf, format: "png", dpi: 72 },
    protect_pdf: { data: pdf, action: "protect", password: "secret" },
    convert_markdown_html: { text: "# Hi\n", to: "html" },
    fetch_page_markdown: { url: "https://example.com/" },
    read_barcode: { file: image },
    optimize_svg: {
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><rect width="10" height="10" fill="#ffffff"/></svg>',
    },
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
    validate_json_schema: { json: '{"a":1}' },
    calculate_emi: { principal: "100000", annualRate: "10", months: 12 },
    calculate_percentage: { mode: "of", a: "10", b: "200" },
    convert_units: { category: "length", from: "m", to: "cm", value: "1", precision: 2 },
    lookup_dns: { name: "example.com", resolver: "cloudflare", mail: true },
    calculate_cidr: { cidr: "192.168.1.0/24" },
    hash_password: { password: "correct horse", algorithm: "bcrypt", cost: 4 },
    generate_keypair: { action: "generate", alg: "ES256" },
    build_csp: { policy: "default-src 'none'; object-src 'none'; base-uri 'none'" },
    validate_sitemap: { url: "https://tools.fabwaseem.com/sitemap.xml", probe: false },
    check_http_headers: { url: "https://example.com/" },
    check_ssl: { host: "example.com" },
    generate_totp: { secret: "JBSWY3DPEHPK3PXP", at: 1000000000000 },
    query_jsonpath: { json: '{"store":{"book":[{"title":"A"}]}}', query: "$.store.book[*].title" },
    calculate_programmer: { expression: "0xFF & 0x0F | (1 << 4)" },
    aes_crypt: { mode: "encrypt", passphrase: "test-passphrase", text: "hello" },
    analyze_har: {
      har: '{"log":{"entries":[{"startedDateTime":"2026-10-18T10:00:00.000Z","time":100,"request":{"method":"GET","url":"https://example.com/"},"response":{"status":200,"statusText":"OK","content":{"size":10,"mimeType":"text/html"}},"timings":{"blocked":1,"dns":2,"connect":3,"send":4,"wait":80,"receive":10}}]}}',
    },
  };

  const client = new Client({ name: "benchline-live-smoke", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(endpoint));
  console.log(`Connecting to ${endpoint} ...`);
  await withRetry("connect", () => client.connect(transport));

  const listed = await withRetry("tools/list", () => client.listTools());
  const names = listed.tools.map((tool) => tool.name).sort();
  console.log(`Listed ${names.length} tools`);

  const missingSamples = names.filter((name) => !(name in samples));
  const extraSamples = Object.keys(samples).filter((name) => !names.includes(name));

  type Row = {
    name: string;
    status: "pass" | "fail" | "skip";
    detail: string;
    ms: number;
  };
  const rows: Row[] = [];

  // Stay under 60 req/min: initialize + list + N calls. Pace ~1.2s between calls.
  for (const [index, name] of names.entries()) {
    const args = samples[name];
    if (!args) {
      rows.push({ name, status: "skip", detail: "no sample args", ms: 0 });
      console.log(`[skip] ${name}`);
      continue;
    }
    const started = Date.now();
    try {
      const result = await withRetry(name, () => client.callTool({ name, arguments: args }));
      const ms = Date.now() - started;
      if (result.isError) {
        rows.push({ name, status: "fail", detail: textOf(result).slice(0, 300), ms });
        console.log(`[fail] ${name} (${ms}ms): ${textOf(result).slice(0, 120)}`);
      } else {
        rows.push({ name, status: "pass", detail: "ok", ms });
        console.log(`[pass] ${name} (${ms}ms)`);
      }
    } catch (error) {
      const ms = Date.now() - started;
      const message = error instanceof Error ? error.message : String(error);
      rows.push({ name, status: "fail", detail: message.slice(0, 300), ms });
      console.log(`[fail] ${name} (${ms}ms): ${message.slice(0, 120)}`);
    }
    if (index < names.length - 1) await sleep(1200);
  }

  await client.close();

  const passed = rows.filter((row) => row.status === "pass").length;
  const failed = rows.filter((row) => row.status === "fail").length;
  const skipped = rows.filter((row) => row.status === "skip").length;
  const summary = {
    endpoint,
    listed: names.length,
    passed,
    failed,
    skipped,
    missingSamples,
    extraSamples,
    rows,
  };
  const outPath = "/tmp/benchline-mcp-live-results.json";
  const { writeFileSync } = await import("node:fs");
  writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify({ endpoint, listed: names.length, passed, failed, skipped, missingSamples, extraSamples }, null, 2));
  console.log(`Wrote ${outPath}`);
  if (failed > 0 || missingSamples.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
