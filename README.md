# Benchline

Free, fast developer and SEO tools at [tools.fabwaseem.com](https://tools.fabwaseem.com): AI search, SEO, auth, tokens, scheduling and shipping Next.js. Generators run in the browser; checkers fetch only the public URL you submit.

## Stack

Next.js 16 (App Router, standalone output), React 19, Tailwind CSS v4, shadcn/ui, zod, vitest. pnpm only.

## Develop

```bash
pnpm install
pnpm dev
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Adding a tool

1. Create `src/tools/<slug>/` with `meta.ts` (name, category, tags, keywords, FAQs, SEO, how-to), `tool.tsx` and pure logic in `lib/`.
2. Add `public/tools/<slug>/cover.png` (1600x900) and `logo.png` (256x256).
3. Add `mcp.ts` beside `meta.ts`. It exports zod input and output schemas, a snake_case `verb_noun` name, and a `run` function over the pure library. File arguments accept base64 or a public URL.
4. Add a call sample in `src/lib/mcp/endpoint.test.ts`. The coverage test fails if a registered tool has no handler or an invalid schema, and the endpoint test calls every tool through `/mcp`.
5. Run `pnpm gen:registry`. The build validates every tool's metadata and registers the MCP and HTTP API.

Directory, category, tag, sitemap, llms.txt and JSON-LD pages are generated from the registry. See `docs/ARCHITECTURE.md` and `docs/DESIGN.md`.

## Deploy

Docker (see `Dockerfile`) on Coolify. Pushes to `main` deploy automatically.
