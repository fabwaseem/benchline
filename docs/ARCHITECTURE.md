# Architecture

Benchline is a Next.js 16 App Router app. Pages are generated from a registry of tool metadata. Each tool's UI is a separate client chunk. The same functions are exposed on a stateless MCP server and a JSON API. There is no account system. Postgres is optional and is used only for anonymous usage counts.

## Registry

`scripts/gen-registry.ts` (`pnpm gen:registry`, also the `prebuild` step) reads every `src/tools/<slug>/meta.ts` and `mcp.ts`.

It checks the metadata with `assertRegistry` in `src/registry/validate.ts`: zod schemas from `src/registry/schema.ts`, unique slugs, known categories and parents, known Lucide icons, known related tools, and a `toolOrder` that lists every tool once. A missing `mcp.ts` fails the script.

It writes:

| File | Role |
| --- | --- |
| `src/registry/index.ts` | Imports every `meta.ts`, exports `tools` |
| `src/registry/loaders.ts` | `slug -> () => import("@/tools/<slug>/tool")` |
| `src/registry/mcp-registry.ts` | The `BenchTool` objects the server registers |
| `src/registry/mcp-index.ts` | Name, title, description, `openWorld` for pages that must not load the handlers |
| `src/registry/search-index.json` | Static snapshot of the catalog. The directory filters the in-memory registry; the command palette uses `searchRecords()` |
| `src/components/site/tool-host.tsx` | `next/dynamic` map used by the tool page |

`src/registry/categories.ts` is written by hand: parents, child categories, and `toolOrder`.

Directory pages import `src/registry/index.ts` and never import `tool.tsx`. The tool page loads one tool through `ToolHost`.

## Library and UI

`src/tools/<slug>/lib/` is the function. vitest covers it. `tool.tsx` is the client workspace. `mcp.ts` calls the same `lib/` and returns the output schema.

The page at `src/app/t/[slug]/page.tsx` is static (`generateStaticParams` from the registry). It renders `ToolPage` (centered, max 1240px, no sidebar), then the header, the lazy workspace, an agent section, related tools, and how-it-works. The workspace itself is kit components: `ToolCard`, `ToolToolbar`, `ToolPanes`.

`runsLocally` on the meta is the privacy flag for the page. `openWorld` on the MCP tool means that handler reaches the network. They are not the same bit: an image tool runs in the browser and still accepts a public URL when an agent calls it.

## MCP server

`POST /mcp` is `src/app/mcp/route.ts`, which calls `handleMcpRequest` in `src/lib/mcp/handler.ts`.

The handler builds an `McpServer` named `benchline` and registers every entry in `mcp-registry.ts`. The transport is `WebStandardStreamableHTTPServerTransport` with `sessionIdGenerator: undefined` and `enableJsonResponse: true`. Each request is its own server. `GET` and `DELETE` return 405.

Limits and checks:

- 60 requests a minute per address (`mcp:<ip>`).
- `Origin`, when present, must match the request host, localhost, `SITE_URL`, `https://benchline.fabwaseem.com`, or `https://tools.fabwaseem.com`.
- Tool errors are caught and returned as `isError: true`.

`SITE_URL` is `NEXT_PUBLIC_SITE_URL` or `https://benchline.fabwaseem.com`.

The guide for people is `src/app/mcp/guide/page.tsx` at `/mcp/guide`. The tool list for people is `/ai`.

## HTTP API

`POST /api/v1/tools/<slug>` runs the same `tool.run` as MCP. It has its own 60-a-minute bucket (`api:<ip>`). Unknown slugs are 404. Bad JSON or a thrown error is 400. `GET /openapi.json` is that surface as OpenAPI 3.1, built from the zod input schemas.

These tools cannot do their job in the browser. Their pages post to a route under `src/app/api/tools/`:

| Page | Route |
| --- | --- |
| llms.txt generator | `/api/tools/llms-txt` |
| AI SEO checker | `/api/tools/ai-seo` |
| robots.txt checker | `/api/tools/robots-txt` |
| Meta tags inspector | `/api/tools/meta-tags` |
| Page to Markdown | `/api/tools/html-markdown` |
| DNS lookup | `/api/tools/dns-lookup` |
| Sitemap validator | `/api/tools/sitemap` |
| HTTP headers | `/api/tools/http-headers` |
| SSL checker | `/api/tools/ssl` |

Those routes call `guard()` in `src/lib/api.ts`: 8 requests per address every 10 minutes. `fetchPublic` (`src/lib/net/fetch-public.ts`) allows public `http`/`https` only, times out after 8 seconds, follows at most four redirects, and stops at 800 KB. The body reader refuses more than 200,000 characters. SSRF checks live in `src/lib/net/ssrf.ts`. The SSL checker opens a TLS socket on port 443 after the same host check.

`/pdfjs/[...path]` serves pdf.js assets to the browser. `outputFileTracingIncludes` in `next.config.ts` traces those files, and traces `linkedom` for the HTML-to-markdown route.

## Other routes

- `/` directory, `/<category>`, `/tags/<tag>`, `/search`, `/explore`, `/categories`
- `/about`
- `/llms.txt` and `/llms-full.txt` from `src/lib/mcp/llms-doc.ts`
- `sitemap.ts`, `robots.ts`, `manifest.ts`

Category URLs come from `src/lib/taxonomy.ts`. A parent with a single child category is a flat nav item.

## Usage tracking

`src/instrumentation.ts` calls `startAnalytics()` once on the Node server, before it accepts requests. The edge runtime skips it. Startup tries to open the DB-IP country database (or download it into the temp directory unless `GEOIP_DOWNLOAD=0`), then, if `DATABASE_URL` is set, opens Postgres and applies migrations. A failure logs a warning and leaves the store unset. Every write path checks that store and returns without throwing.

The client is [postgres.js](https://github.com/porsager/postgres) (`postgres`). It is pure JavaScript with a built-in pool and tagged-template queries, so the Alpine image does not need a native addon or a separate types package. The pool is four connections, with a 20 second idle timeout and a 5 second connect timeout.

Migrations live in `src/lib/analytics/sql.ts`. `applyMigrations` creates `schema_migrations` if it is missing, then takes `pg_advisory_xact_lock(814263001)` and runs each version that is not already recorded. `001_analytics` creates `tool_runs`, `page_views`, `tool_opens`, `search_queries`, `ui_actions`, and `analytics_daily`, with indexes on time and on `(slug, ts)`, `(source, ts)`, and `(day, slug, source)` for runs. `pnpm db:migrate` runs the same function.

Events sit in an in-memory queue (2,000 max, flush at 50 events or every 3 seconds). Overflow drops the new event and logs every 100 drops. A failed flush logs the error with any `postgres://` URL redacted and drops that batch. `SIGTERM` and `SIGINT` flush the queue and close the pool. They do not call `process.exit`.

MCP (`src/lib/mcp/handler.ts`) and `POST /api/v1/tools/<slug>` record a run after the tool returns. The existing `clientIp()` rate-limit key is unchanged. Analytics reads `X-Real-Ip`, then the first `X-Forwarded-For` entry, and hashes it. Country comes from the mmdb lookup; `cf-ipcountry`, `x-vercel-ip-country`, `cloudfront-viewer-country`, `x-country-code`, and `x-appengine-country` are used only when the lookup returns nothing. If Cloudflare is later placed in front and the database still resolves the connecting address, that lookup wins over the header.

The MCP server stays stateless (`sessionIdGenerator` is unset). A small request body (16 KB or less) is cloned to read `initialize` client info and the `tools/call` name. Client name and version are cached in memory for six hours, keyed by a hash of the analytics IP and user agent, and are not written as a table of their own. A later call on the same process can attach that name. A body over 16 KB is not cloned. The `mcp-session-id` header, when the client sends one, is stored as a session key.

Browser tools mount `ToolBeacon` from the generated host. Network tools report through `postTool`. Other tools emit a debounced run from input, change, drop, and click inside the tool, skipping copy, download, clear, sample, cancel, close, and reset. Byte size is the length of visible fields and selected files. Values are not sent. `AnalyticsListener` records the path (not the query string) as a page view, and copy or download clicks. Search text from the directory and the command palette is capped at 80 characters; URL-like and token-like queries are dropped.

`GET /api/v1/stats` requires `Authorization: Bearer` matching `STATS_TOKEN` with a length check before `timingSafeEqual`. No token, or the wrong token, is 404. A valid token with no database is 503. Duration percentiles use `percentile_cont` on raw `duration_ms`. After those rows are rolled up, the same window uses the 11-bucket histogram on `analytics_daily`. A day that still has raw rows is not also counted from the rollup.

Retention takes `pg_advisory_xact_lock(814263002)`, inserts daily aggregates for rows older than the cutoff, then deletes those raw rows. The default cutoff is 90 days (`ANALYTICS_RETENTION_DAYS`, clamped to 1..3650). The job runs at startup and every 24 hours. `pnpm db:retain` is the same job.

## Deployment

`next.config.ts` sets `output: "standalone"`. `Dockerfile` builds on Node 22 Alpine with pnpm 10.33.4, downloads the DB-IP country lite database, and runs `node server.js` as user `nextjs` on port 3000. `serverExternalPackages` includes `postgres` and `mmdb-lib`. The runner also copies `data/` and those two packages next to the standalone server.

`serverExternalPackages` lists `@napi-rs/canvas`, `@resvg/resvg-js`, `satori`, `pdfjs-dist`, `tesseract.js`, `tesseract.js-core`, `zxing-wasm`, and `sharp`. The `mcpNativeAssets` array is traced into `/mcp` and `/api/v1/tools/[slug]`, including Satori, Resvg, and the Tesseract worker dependencies (`bmp-js`, `zlibjs`, `wasm-feature-detect`, and the rest of that closure). The image copies those packages into the runner so the tools resolve outside the traced standalone output.

CI (`.github/workflows/ci.yml`) runs install, lint, typecheck, test, and build on pull requests and on `main`.
