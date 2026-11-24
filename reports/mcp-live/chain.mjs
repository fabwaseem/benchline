// Round-trip checks over the live MCP server: feed one tool's output into another,
// so a result is checked for being right, not just for coming back. Writes chain.json.
// Run: node reports/mcp-live/chain.mjs [endpoint]
import { writeFile } from "node:fs/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { PDFDocument, StandardFonts } from "pdf-lib";

const endpoint = process.argv[2] ?? "https://benchline.fabwaseem.com/mcp";
const client = new Client({ name: "benchline-live-chain", version: "1.0.0" });
await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(name, args) {
  await sleep(1100);
  const result = await client.callTool({ name, arguments: args });
  const text = (result.content ?? []).find((b) => b.type === "text")?.text ?? "";
  return { isError: Boolean(result.isError), data: result.structuredContent ?? {}, text, bytes: JSON.stringify(result).length };
}

const checks = [];
async function check(label, fn) {
  try {
    const { pass, detail } = await fn();
    checks.push({ label, pass, detail });
  } catch (error) {
    checks.push({ label, pass: false, detail: `exception: ${error.message}` });
  }
  const last = checks.at(-1);
  console.log(`${last.pass ? "PASS" : "FAIL"} ${label} → ${String(last.detail).slice(0, 160)}`);
}

// A PDF with large text, for OCR via render_pdf_pages.
const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.HelveticaBold);
doc.addPage([600, 200]).drawText("BENCHLINE 2026", { x: 40, y: 80, size: 56, font });
const pdf = Buffer.from(await doc.save()).toString("base64");

await check("QR code → read_barcode decodes the same URL", async () => {
  const qr = await call("generate_qr_code", { type: "url", url: "https://benchline.fabwaseem.com/tools" });
  const png = qr.data.pngBase64;
  const read = await call("read_barcode", { file: { data: png, filename: "qr.png", mimeType: "image/png" } });
  const value = read.data.codes?.[0]?.text ?? read.data.codes?.[0]?.value ?? JSON.stringify(read.data.codes?.[0] ?? null);
  return { pass: String(value).includes("benchline.fabwaseem.com/tools"), detail: `decoded: ${value}` };
});

await check("PDF page → PNG → read_image_text (OCR) reads the words", async () => {
  const rendered = await call("render_pdf_pages", { data: pdf, format: "png", dpi: 150 });
  const png = rendered.data.images?.[0]?.data;
  const ocr = await call("read_image_text", { file: { data: png, filename: "page.png", mimeType: "image/png" }, language: "eng" });
  return { pass: /BENCHLINE/i.test(ocr.data.text ?? ""), detail: `text: ${JSON.stringify(ocr.data.text)} conf ${ocr.data.confidence}` };
});

await check("aes_crypt encrypt → decrypt returns the plaintext", async () => {
  const enc = await call("aes_crypt", { mode: "encrypt", passphrase: "pass-123", text: "secret message" });
  const dec = await call("aes_crypt", { mode: "decrypt", passphrase: "pass-123", bundle: enc.data.bundle });
  return { pass: (dec.data.text ?? dec.data.output ?? dec.data.plaintext) === "secret message", detail: JSON.stringify(dec.data).slice(0, 160) };
});

await check("aes_crypt decrypt with the wrong passphrase fails cleanly", async () => {
  const enc = await call("aes_crypt", { mode: "encrypt", passphrase: "pass-123", text: "secret" });
  const dec = await call("aes_crypt", { mode: "decrypt", passphrase: "wrong", bundle: enc.data.bundle });
  return { pass: dec.isError || /wrong|fail|decrypt/i.test(dec.text), detail: `isError=${dec.isError} ${dec.text.slice(0, 120)}` };
});

await check("hash_password verify accepts the right password", async () => {
  const made = await call("hash_password", { password: "correct horse", algorithm: "bcrypt", cost: 4 });
  const verify = await call("hash_password", { password: "correct horse", algorithm: "bcrypt", cost: 4, hash: made.data.hash });
  return { pass: verify.data.verified === true, detail: `verified=${verify.data.verified}${verify.isError ? ` error: ${verify.text.slice(0, 120)}` : ""}` };
});

await check("base64 encode → decode round-trips", async () => {
  const enc = await call("base64_codec", { text: "héllo ✓" });
  const dec = await call("base64_codec", { text: enc.data.output, action: "decode" });
  return { pass: dec.data.output === "héllo ✓", detail: `decoded: ${JSON.stringify(dec.data.output)}${dec.isError ? ` error: ${dec.text.slice(0, 100)}` : ""}` };
});

await check("merge two 1-page PDFs → read back 2 pages", async () => {
  const merged = await call("merge_pdf", { files: [{ name: "a.pdf", data: pdf }, { name: "b.pdf", data: pdf }] });
  const text = await call("extract_pdf_text", { data: merged.data.data });
  return { pass: merged.data.pageCount === 2 && text.data.pageCount === 2, detail: `merged pages ${merged.data.pageCount}, read back ${text.data.pageCount}` };
});

await check("protect_pdf → unlock with the password", async () => {
  const locked = await call("protect_pdf", { data: pdf, action: "protect", password: "pw1" });
  const opened = await call("protect_pdf", { data: locked.data.data, action: "unlock", password: "pw1" });
  return { pass: !opened.isError && opened.data.encrypted === false, detail: opened.isError ? opened.text.slice(0, 160) : JSON.stringify({ ...opened.data, data: undefined }) };
});

await check("convert_currency USD → EUR returns a rate", async () => {
  const r = await call("convert_currency", { amount: 100, from: "USD", to: "EUR" });
  return { pass: r.data.ok !== false && !r.isError, detail: JSON.stringify(r.data).slice(0, 160) };
});

await check("convert_currency USD → PKR uses the wider fallback source", async () => {
  const r = await call("convert_currency", { amount: 100, from: "USD", to: "PKR" });
  return { pass: r.data.ok === true && r.data.source === "fawazahmed0", detail: JSON.stringify(r.data).slice(0, 160) };
});

await check("convert_currency with an unknown code is flagged as an error", async () => {
  const r = await call("convert_currency", { amount: 100, from: "USD", to: "XYZ" });
  return { pass: r.isError, detail: `isError=${r.isError} ${JSON.stringify(r.data)}` };
});

await check("format_json with broken JSON answers valid:false with positions", async () => {
  const r = await call("format_json", { json: "{bad" });
  return { pass: !r.isError && r.data.valid === false && r.data.errors?.length > 0, detail: `isError=${r.isError} valid=${r.data.valid}` };
});

await check("check_ssl on an expired certificate reports it", async () => {
  const r = await call("check_ssl", { host: "expired.badssl.com" });
  return { pass: r.data.authorized === false || /expired/i.test(r.text), detail: `authorized=${r.data.authorized} ${r.data.authorizationError ?? ""} ${r.isError ? r.text.slice(0, 100) : ""}` };
});

await check("lookup_dns for a missing domain answers without crashing", async () => {
  const r = await call("lookup_dns", { name: "no-such-domain-benchline-xyz.com", resolver: "cloudflare" });
  return { pass: true, detail: `isError=${r.isError} records=${r.data.records?.length ?? "?"} ${r.isError ? r.text.slice(0, 100) : ""}` };
});

await check("inspect_meta_tags on a 404 page reports the status", async () => {
  const r = await call("inspect_meta_tags", { url: "https://benchline.fabwaseem.com/this-page-does-not-exist" });
  return { pass: r.data.status === 404 || r.isError, detail: `status=${r.data.status} isError=${r.isError} ${r.isError ? r.text.slice(0, 100) : ""}` };
});

await check("generate_meme response size", async () => {
  const r = await call("generate_meme", { top: "hello", bottom: "world" });
  return { pass: r.bytes < 400_000, detail: `${r.bytes} bytes for a ${r.data.width}x${r.data.height} PNG` };
});

await client.close();
await writeFile(new URL("chain.json", import.meta.url), JSON.stringify(checks, null, 2));
console.log(`\n${checks.filter((c) => c.pass).length}/${checks.length} passed`);
