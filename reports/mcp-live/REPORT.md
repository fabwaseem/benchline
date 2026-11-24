# Benchline MCP live test report

**Date:** 2026-11-24
**Endpoint:** `https://benchline.fabwaseem.com/mcp` (Streamable HTTP, stateless, no key)
**Client:** official `@modelcontextprotocol/sdk` client (`Client` + `StreamableHTTPClientTransport`), the same path Claude Code, Cursor and other agents use. The server was also added to Claude Code for this project (`claude mcp add --transport http benchline …`, status **Connected**).

## Summary

| Check | Result |
|---|---|
| Connect + initialize | ✅ 444 ms. Server `benchline` 1.0.0, capability `tools`, 868-char instructions |
| `tools/list` | ✅ 82 tools in 486 ms. Matches `/api/v1/tools` (82) and `/.well-known/mcp.json` |
| Every tool called once with realistic input | ✅ **82 / 82 returned a result**, 0 exceptions, 0 schema errors |
| Agent edge cases (URL input, private IPs, bad args, unknown tool) | ✅ 6 / 7. The one miss is by design (issue 2) |
| Round trips (output of one tool fed into another) | ✅ 11 / 15. The 4 misses are the issues below |
| Speed | median **223 ms**, p90 476 ms, slowest 1.3 s (OCR). All 82 calls took 25 s in total |
| Tool annotations | every tool has `readOnlyHint` and `idempotentHint`; `openWorldHint` is true only for tools that fetch from the network or accept URLs |
| HTTP surface | `GET /mcp` gives a helpful 405 with `Allow: POST`. A foreign `Origin` gets 403. A bad protocol version gets 400 and lists the supported versions |

**Verdict:** every tool works over MCP on the live deploy. One real bug (issue 1) and five agent-usability problems (issues 2–6) are listed below in priority order.

## Fix status (same day)

| # | Fix | Where |
|---|---|---|
| 1 | Root cause: pdf.js in Node reads font, cmap and wasm data with `fs.readFile(string)`, and we passed a `file://` URL string, which fs treats as a literal path. Every load failed. Windows hid it through system-font fallback; Alpine has no fonts. pdf.js now gets plain paths. This also fixes CJK text extraction (cmaps) and JBIG2/JPX images (wasm). | `src/lib/pdf-assets.ts`, `src/lib/pdf-node.ts`, test `render-server.test.ts` (fails on the old code) |
| 2 | `ok:false` now sets `isError` and keeps `structuredContent`. Analytics record it as `rejected / invalid_input`. The REST API returns 422 for the same case. Two endpoint-test samples (GraphQL, currency) had been failing silently and are now fixed. | `src/lib/mcp/result.ts`, `handler.ts`, `api/v1/tools/[slug]/route.ts` |
| 3 | The text copy replaces base64 files with a pointer into `structuredContent` | `textCopy()` in `result.ts` |
| 4 | Input schemas are strict, so an unknown key gives -32602 naming the key (REST: 400). The JSON Schema now has `additionalProperties: false`. | `strictInput()` in `result.ts` |
| 5 | Codes outside the ECB list fall back to the free fawazahmed0 rates (about 200 currencies, dated snapshots). The result has a `source` field. | `currency-converter/lib/currency.ts`, `mcp.ts` |
| 6 | The original is returned when a same-format, same-size re-encode comes out bigger (`keptOriginal`, `note`). If a format change was asked for, the converted file is still returned, with a note. | `image-compress/lib/compress.ts`, `src/lib/mcp/image.ts` |

Re-run `run.mjs`, `chain.mjs` and `render-probe.mjs` after the next deploy to confirm on the live server.

## Issues found

### 1. `render_pdf_pages` draws text blank on the server: bug, high

PDFs that use the 14 standard PDF fonts without embedding them (Helvetica, Times, Courier; this is what pdf-lib, many invoice tools and simple generators produce) render as **white pages with no text**. Shapes and PDFs with embedded fonts render correctly.

| Probe (`render-probe.mjs`) | Live result |
|---|---|
| Rectangle only | drawn |
| Helvetica text | **blank** |
| Times text | **blank** |
| w3.org `dummy.pdf` (embedded font) | drawn |

The same code renders the text correctly on Windows. So in production pdf.js is not loading `pdfjs-dist/standard_fonts`, falls back to system fonts, and the Alpine image has none.
**Knock-on:** any agent pipeline that goes PDF → image → `read_image_text` returns empty text. OCR itself is fine: a plain image reading "HELLO WORLD" came back with 96% confidence.
**Fix:** check that `standardFontDataUrl` resolves inside the container (the `file://…/node_modules/pdfjs-dist/standard_fonts/` path in `src/lib/pdf-node.ts`). As a fallback, add a font package to the runner image (`apk add font-liberation` or `ttf-dejavu`). Add a test that renders Helvetica text and checks for dark pixels.

### 2. Failures reported as success (`ok:false` without `isError`): medium

Twelve tools put success in the payload (`ok` or `valid`): base64-codec, color-converter, cron-expression-builder, csv-json-convert, currency-converter, diff-checker, graphql-client, json-formatter, json-schema-validate, json-yaml-convert, jwt-decoder and websocket-tester. When their input is bad they return `isError: false` with `{ ok: false, error: "…" }`, for example `convert_currency` with PKR. Agents and MCP clients branch on `isError`, so they treat the call as a success. The admin dashboard also records these calls as **ok** runs.
**Fix:** in `src/lib/mcp/handler.ts`, set `isError: true` when the structured result has `ok === false` and a non-empty `error`. Keep `structuredContent` so the detail still reaches the agent. A `valid: false` result from a validator (JSON Schema, WebSocket URL, JSON syntax) is an answer, not a failure, and can stay as it is.

### 3. Binary outputs are sent twice: medium

The handler returns `content: [{ type: "text", text: JSON.stringify(structured) }]` **and** `structuredContent`, so every base64 image or PDF travels twice. `generate_meme` returned **593 KB** for one 1080×1080 PNG. `build_open_graph`, `resize_social_image` and `generate_favicon` each return over 50 KB. This uses up an agent's context window and is slow on mobile links.
**Fix:** in the text copy, replace base64 strings over about 1 KB with a short note (`"<base64 PNG, 303 KB, see structuredContent.png>"`), or return images as MCP `image` content blocks. Then compress meme PNGs, or offer JPEG.

### 4. Unknown arguments are dropped silently: medium

zod strips keys the schema doesn't know. An agent that guessed `{ mode: "decode" }` for `base64_codec` (the real key is `action`) got its Base64 **re-encoded** with no warning, and `hash_password` with `verify:` quietly hashed again. Both happened during this test.
**Fix:** use `.strict()` on input schemas so a wrong key returns a -32602 error that names it. Alternatively, return a `warnings: ["unknown argument 'mode' ignored; did you mean 'action'?"]` field.

### 5. `convert_currency` supports only the ECB list: low

Frankfurter/ECB covers about 30 currencies, so PKR, AED, SAR and others fail with `Unknown currency: PKR.`
**Fix:** list the supported codes in the error and in the tool description, or fall back to a second rate source.

### 6. `compress_image` can return a bigger file: low

A tiny PNG compressed to WebP came out **34% larger**, and that larger file was returned. `compress_pdf` already keeps the original when it can't save anything (`keptOriginal`).
**Fix:** apply the same rule to images.

### Notes (not bugs)

- `resources/list` and `prompts/list` return -32601. That is correct, because only `tools` is advertised. Exposing the llms.txt or catalogue as a resource is optional.
- `tools/list` works without `initialize`, as expected for a stateless server.
- `inspect_meta_tags` on a 404 page returns `isError` ("The page returned 404."). Agents may still want the 404 page's tags, so consider returning them with `status: 404`.

## Edge cases an agent would hit

| Case | Expected | Got | Pass |
|---|---|---|---|
| split_pdf from a public URL | ok | ok: {"files":[{"name":"document-extract.pdf","data":"JVBERi0xLjcKJYGBgYEKC | ✅ |
| extract_pdf_text from a public URL | ok | ok: {"pageCount":1,"pages":[{"page":1,"text":"Dummy PDF file","markdown":" | ✅ |
| private address is refused | error | error: That address is not public. | ✅ |
| metadata address is refused | error | error: That address is not public. | ✅ |
| missing required field | error | error: MCP error -32602: Input validation error: Invalid arguments for tool d | ✅ |
| invalid JSON input | error | ok: {"output":"","valid":false,"errors":[{"message":"Invalid symbol","line | ❌ (by design, issue 2) |
| unknown tool name | error | error: MCP error -32602: Tool no_such_tool not found | ✅ |

## Round-trip checks

| Check | Pass | Detail |
|---|---|---|
| QR code → read_barcode decodes the same URL | ✅ | decoded: https://benchline.fabwaseem.com/tools |
| PDF page → PNG → read_image_text (OCR) reads the words | ❌ | text: "" conf 0. Caused by issue 1 (blank render); OCR on a real text image reads 96% |
| aes_crypt encrypt → decrypt returns the plaintext | ✅ | {"mode":"decrypt","plaintext":"secret message"} |
| aes_crypt decrypt with the wrong passphrase fails cleanly | ✅ | isError=true Decryption failed. The passphrase is wrong or the data was tampered with. |
| hash_password verify accepts the right password | ✅ | verified=true |
| base64 encode → decode round-trips | ✅ | decoded: "héllo ✓" |
| merge two 1-page PDFs → read back 2 pages | ✅ | merged pages 2, read back 2 |
| protect_pdf → unlock with the password | ✅ | {"bytes":1047,"encrypted":false} |
| convert_currency USD → EUR returns a rate | ✅ | {"ok":true,"amount":100,"from":"USD","to":"EUR","rate":0.91416,"result":91.416,"date":"202 |
| convert_currency with an unsupported code is flagged as an error | ❌ | isError=false {"ok":false,"error":"Unknown currency: PKR."} |
| format_json with broken JSON is flagged as an error | ❌ | isError=false valid=false |
| check_ssl on an expired certificate reports it | ✅ | authorized=false CERT_HAS_EXPIRED  |
| lookup_dns for a missing domain answers without crashing | ✅ | isError=false records=0  |
| inspect_meta_tags on a 404 page reports the status | ✅ | status=undefined isError=true The page returned 404. |
| generate_meme response size | ❌ | 607264 bytes for a 1080x1080 PNG |

## Every tool

| # | Tool | Title | Result | ms | Reply KB | Notes |
|---|---|---|---|---:|---:|---|
| 1 | `generate_llms_txt` | Generate llms.txt | ✅ ok | 185 | 0.6 |  |
| 2 | `score_ai_seo` | Score a page for AI search | ✅ ok | 476 | 6.2 |  |
| 3 | `build_open_graph` | Build an Open Graph card | ✅ ok | 604 | 56.5 |  |
| 4 | `list_og_templates` | List Open Graph templates | ✅ ok | 206 | 38.6 |  |
| 5 | `decode_jwt` | Decode a JWT | ✅ ok | 174 | 0.8 |  |
| 6 | `check_robots_txt` | Check robots.txt | ✅ ok | 373 | 109.9 |  |
| 7 | `inspect_meta_tags` | Inspect meta tags | ✅ ok | 309 | 6.7 |  |
| 8 | `build_json_ld` | Build JSON-LD | ✅ ok | 188 | 1.0 |  |
| 9 | `count_tokens` | Count tokens | ✅ ok | 214 | 0.9 |  |
| 10 | `explain_cron` | Explain a cron expression | ✅ ok | 303 | 2.3 |  |
| 11 | `build_nextjs_dockerfile` | Build a Next.js Dockerfile | ✅ ok | 180 | 3.5 |  |
| 12 | `format_json` | Format and validate JSON | ✅ ok | 217 | 0.3 | Broken JSON gives valid:false, not isError (issue 2) |
| 13 | `convert_data_format` | Convert JSON, YAML, TOML, or XML | ✅ ok | 197 | 0.3 |  |
| 14 | `convert_csv_json` | Convert CSV and JSON | ✅ ok | 215 | 0.5 |  |
| 15 | `diff_text` | Diff two texts | ✅ ok | 204 | 1.6 |  |
| 16 | `base64_codec` | Encode or decode Base64 | ✅ ok | 187 | 0.3 | Unknown arg ignored silently in test (issue 4) |
| 17 | `convert_image` | Convert an image | ✅ ok | 223 | 1.2 |  |
| 18 | `compress_image` | Compress an image | ✅ ok | 189 | 0.8 | 1px input got 34% larger, original not kept (issue 6) |
| 19 | `resize_image` | Resize an image | ✅ ok | 216 | 0.6 |  |
| 20 | `convert_color` | Convert a color and check contrast | ✅ ok | 207 | 0.7 |  |
| 21 | `convert_unix_timestamp` | Convert a unix timestamp | ✅ ok | 224 | 0.6 |  |
| 22 | `date_difference` | Difference between two dates | ✅ ok | 424 | 0.5 |  |
| 23 | `hash_data` | Hash text or bytes | ✅ ok | 184 | 1.4 |  |
| 24 | `generate_uuid` | Generate or inspect a UUID | ✅ ok | 188 | 0.4 |  |
| 25 | `url_codec` | Encode, decode, or parse a URL | ✅ ok | 185 | 0.6 |  |
| 26 | `generate_password` | Generate a password or passphrase | ✅ ok | 305 | 0.3 |  |
| 27 | `explain_chmod` | Explain a chmod mode | ✅ ok | 228 | 0.3 |  |
| 28 | `merge_pdf` | Merge PDF files | ✅ ok | 297 | 3.0 |  |
| 29 | `split_pdf` | Split a PDF | ✅ ok | 208 | 2.5 | Also works from a public URL; private IP refused |
| 30 | `compress_pdf` | Compress a PDF | ✅ ok | 294 | 2.8 |  |
| 31 | `images_to_pdf` | Build a PDF from images | ✅ ok | 223 | 3.2 |  |
| 32 | `generate_qr_code` | Generate a QR code | ✅ ok | 523 | 11.8 |  |
| 33 | `extract_pdf_text` | Extract PDF text | ✅ ok | 760 | 0.7 |  |
| 34 | `organize_pdf` | Organize PDF pages | ✅ ok | 213 | 2.5 |  |
| 35 | `render_pdf_pages` | Render PDF pages | ✅ ok | 267 | 5.7 | ⚠️ Text in standard PDF fonts renders blank (issue 1) |
| 36 | `protect_pdf` | Protect or unlock a PDF | ✅ ok | 401 | 5.2 | Protect then unlock verified |
| 37 | `convert_markdown_html` | Convert Markdown and HTML | ✅ ok | 257 | 0.2 |  |
| 38 | `fetch_page_markdown` | Fetch a page as Markdown | ✅ ok | 346 | 0.9 |  |
| 39 | `read_barcode` | Read a QR code or barcode | ✅ ok | 304 | 0.1 | Round-trip verified: decoded the QR URL |
| 40 | `optimize_svg` | Optimize an SVG | ✅ ok | 269 | 0.5 |  |
| 41 | `read_exif` | Read or strip photo metadata | ✅ ok | 227 | 1.0 |  |
| 42 | `crop_image` | Crop an image | ✅ ok | 204 | 0.5 |  |
| 43 | `generate_favicon` | Generate a favicon pack | ✅ ok | 872 | 53.0 |  |
| 44 | `read_image_text` | Read text from an image | ✅ ok | 1302 | 0.2 | OCR verified separately: 96% on a text image |
| 45 | `remove_background` | Remove a solid image background | ✅ ok | 312 | 1.0 |  |
| 46 | `count_text` | Count words and characters | ✅ ok | 195 | 1.4 |  |
| 47 | `convert_case` | Convert text case | ✅ ok | 199 | 2.5 |  |
| 48 | `generate_fake_data` | Generate lorem ipsum or fake rows | ✅ ok | 521 | 0.2 |  |
| 49 | `test_regex` | Test a JavaScript regular expression | ✅ ok | 220 | 0.5 |  |
| 50 | `format_sql` | Format SQL | ✅ ok | 334 | 0.2 |  |
| 51 | `validate_json_schema` | Infer or validate JSON Schema | ✅ ok | 188 | 1.0 |  |
| 52 | `calculate_emi` | Calculate a loan EMI | ✅ ok | 312 | 4.2 |  |
| 53 | `calculate_percentage` | Calculate a percentage | ✅ ok | 185 | 0.2 |  |
| 54 | `convert_units` | Convert units | ✅ ok | 191 | 0.9 |  |
| 55 | `lookup_dns` | Look up DNS records | ✅ ok | 376 | 11.3 |  |
| 56 | `calculate_cidr` | Calculate a CIDR block | ✅ ok | 227 | 0.8 |  |
| 57 | `hash_password` | Hash or verify a password | ✅ ok | 214 | 0.4 | Hash then verify round-trip verified |
| 58 | `generate_keypair` | Generate or convert a key pair | ✅ ok | 207 | 3.1 |  |
| 59 | `build_csp` | Build a Content-Security-Policy | ✅ ok | 190 | 2.0 |  |
| 60 | `validate_sitemap` | Validate or generate a sitemap | ✅ ok | 1183 | 12.8 |  |
| 61 | `check_http_headers` | Check HTTP response headers | ✅ ok | 344 | 13.8 |  |
| 62 | `check_ssl` | Check a TLS certificate | ✅ ok | 257 | 3.3 | Expired cert correctly reported |
| 63 | `generate_totp` | Generate a TOTP/HOTP one-time code | ✅ ok | 211 | 0.3 |  |
| 64 | `query_jsonpath` | Run a JSONPath query | ✅ ok | 226 | 0.4 |  |
| 65 | `calculate_programmer` | Evaluate a programmer expression | ✅ ok | 186 | 0.3 |  |
| 66 | `aes_crypt` | Encrypt or decrypt with AES-GCM | ✅ ok | 249 | 0.4 | Encrypt/decrypt round-trip verified |
| 67 | `analyze_har` | Analyze a HAR file | ✅ ok | 233 | 1.3 |  |
| 68 | `convert_json_to_types` | Convert JSON to type definitions | ✅ ok | 199 | 0.7 |  |
| 69 | `minify_code` | Minify JavaScript, CSS, or HTML | ✅ ok | 237 | 0.3 |  |
| 70 | `convert_curl` | Convert a curl command to code | ✅ ok | 191 | 0.9 |  |
| 71 | `execute_graphql` | Execute a GraphQL query | ✅ ok | 509 | 0.3 | Real public endpoint, correct data |
| 72 | `validate_websocket_url` | Validate a WebSocket URL | ✅ ok | 181 | 0.3 |  |
| 73 | `generate_resume` | Generate a resume PDF | ✅ ok | 415 | 3.2 |  |
| 74 | `generate_invoice` | Generate an invoice or quote PDF | ✅ ok | 305 | 4.7 |  |
| 75 | `sign_pdf` | Sign a PDF with a PNG signature | ✅ ok | 198 | 4.3 |  |
| 76 | `resize_social_image` | Resize an image to social media dimensions | ✅ ok | 273 | 66.5 |  |
| 77 | `trim_audio` | Trim a WAV audio file | ✅ ok | 202 | 0.5 |  |
| 78 | `convert_currency` | Convert an amount between currencies | ✅ ok | 182 | 0.2 | ⚠️ Failure returned as success; PKR unsupported (issues 2, 5) |
| 79 | `generate_meme` | Generate a meme image | ✅ ok | 904 | 593.0 | ⚠️ 593 KB reply, the image is sent twice (issue 3) |
| 80 | `zip_files` | Zip files or unzip an archive | ✅ ok | 186 | 0.5 |  |
| 81 | `make_collage` | Make a photo collage | ✅ ok | 316 | 6.5 |  |
| 82 | `fill_pdf_form` | Fill a PDF form | ✅ ok | 206 | 0.4 |  |

## Files in this folder

- `REPORT.md`: this report
- `run.mjs`: calls all tools plus the edge cases and writes `results.json` (inputs, timings, output previews and HTTP checks)
- `chain.mjs`: round-trip checks; writes `chain.json`
- `render-probe.mjs`: narrows issue 1

Re-run after a deploy (they pace themselves under the 60 calls/min limit):

```
node reports/mcp-live/run.mjs
node reports/mcp-live/chain.mjs
node reports/mcp-live/render-probe.mjs
```
