# Contributing

Thanks for improving Benchline. The live site is [https://tools.fabwaseem.com](https://tools.fabwaseem.com). Issues and pull requests go to [github.com/fabwaseem/benchline](https://github.com/fabwaseem/benchline).

## Development setup

Node 22 (`.nvmrc`) and pnpm 10.33.4 (`packageManager` in `package.json`). Corepack selects that pnpm.

```bash
pnpm install
pnpm dev
```

Checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm build` runs `pnpm gen:registry` first. Tests are vitest files matching `src/**/*.test.ts`.

`NEXT_PUBLIC_SITE_URL` is optional. See `.env.example`.

## Branches and commits

- Branch from `main`. Use a short descriptive name.
- Rebase onto `main`. Do not merge `main` into the branch.
- Commit subjects are plain sentences, such as `Add a CIDR calculator`. Do not add a `Co-authored-by` trailer.

## Add a tool

A tool is a folder. The directory, sitemap, `llms.txt`, MCP server, and HTTP API all read the registry that `pnpm gen:registry` writes. Do not register a tool by hand in a page.

1. Create `src/tools/<slug>/`. The slug is kebab-case and matches the folder name.
2. Add `meta.ts` exporting `meta`. The shape is `ToolMeta` in `src/registry/schema.ts`: name, tagline, description, category, tags, keywords, status (`stable`, `beta`, `new`, or `deprecated`), `createdAt` and `updatedAt` (`YYYY-MM-DD`), a Lucide icon name that exists in `src/lib/icons.ts`, related slugs, FAQs, SEO, how-to steps, inputs, outputs, and `runsLocally`. `runsLocally` is true only when the page never posts the user's input.
3. Add the slug once to `toolOrder` in `src/registry/categories.ts`. The category must already exist and must point at a parent. The build rejects a duplicate slug, an unknown category, an unknown related tool, or a `toolOrder` that is not exactly the set of tools.
4. Add `tool.tsx` with a default export and `"use client"`. The page shell is `src/app/t/[slug]/page.tsx`. It renders `ToolPage`, the header, the agent block, related tools, and how-it-works. Your component is the workspace inside that shell. Do not import tool UI from a directory page. The directory loads metadata only.
5. Put the logic in `lib/` as pure functions, with zod at the boundary when the input needs a schema. Add `lib/*.test.ts`. No network and no DOM in `lib/` unless that tool's job is a pure parser of text you already have. Fetching belongs in `remote.ts` or the API route, and `runsLocally` is then false.
6. Add `public/tools/<slug>/cover.png` (1600×900, the Open Graph size in `COVER_SIZE`) and `logo.png` (256×256). `src/lib/assets.test.ts` fails when either file is missing.
7. Add `mcp.ts`. It exports zod `inputSchema` and `outputSchema` (both objects) and `tool`:

   ```ts
   export const tool = {
     slug: "<slug>",
     name: "verb_noun",
     title: "Short title",
     description: "What the call returns, and what it refuses.",
     openWorld: false,
     inputSchema,
     outputSchema,
     run,
   };
   ```

   `name` matches `^[a-z][a-z0-9]*(_[a-z0-9]+)+$` (snake_case `verb_noun`, at least two words). `run` calls the pure `lib/`. Throw on bad input or a failed run. The shared handler in `src/lib/mcp/handler.ts` catches that and returns `isError: true`. Do not catch an error and return a normal result.
   Set `openWorld` to true when the handler fetches a URL or opens a network connection.
   File arguments use `mcpFileSchema` or `readMcpBytes` from `src/lib/mcp/bytes.ts`: either `url` or `data`, 10 MB, private addresses blocked.
8. Add a `tools/call` sample in two places:
   - `samples` in `src/lib/mcp/endpoint.test.ts`, which calls every tool through the handler.
   - `samples` in `scripts/live-mcp-smoke.mts`, which calls the live server at `MCP_URL`.
9. If the tool needs a wasm, native, or worker package that Next cannot bundle, add it in all three places that already list `pdfjs-dist`, `zxing-wasm`, and `tesseract.js`:
   - `serverExternalPackages` in `next.config.ts`
   - the `mcpNativeAssets` array in `next.config.ts` (`outputFileTracingIncludes` for `/mcp` and `/api/v1/tools/[slug]`)
   - the copy in the runner stage of `Dockerfile`
10. Run `pnpm gen:registry`. It rewrites `src/registry/index.ts`, `loaders.ts`, `mcp-registry.ts`, `mcp-index.ts`, `search-index.json`, and `src/components/site/tool-host.tsx`. Then run `pnpm gen:readme-tools` and `pnpm gen:mcp-docs` so the README tool list and `docs/MCP.md` match.

`src/lib/mcp/coverage.test.ts` fails when a folder has no `mcp.ts`, when the name or schema is invalid, or when the registry and the folders disagree. `src/lib/mcp/endpoint.test.ts` calls `tools/list` and `tools/call` for every tool.

## UI

Build the workspace from `src/components/kit`. Do not restyle primitives ad hoc, and do not invent one-off colors. Tokens live in `src/app/globals.css`.

`ToolPage` is the centered column (`max-w-[1240px]`). Inside it, the workspace is a `ToolCard`: `ToolToolbar`, then `ToolPanes` (`50/50`, `40/60`, `35/65`, or `60/40`). Panes stack under 900px. Checkers use `35/65` with a `ScoreCard` and a `ResultsTable`. There is no third column and no directory sidebar on a tool page.

Both themes have to work. `next-themes` toggles the `dark` class. Radii stay low: `--radius` is 4px, and the largest token is 8px. Do not introduce large corner radii.

## Libraries

Dependencies are added with `pnpm add <pkg>` at the current latest. Do not pin a version by hand.

Permissive licenses only: MIT, Apache-2.0, BSD, ISC, and similar. No AGPL, GPL, or LGPL. HEIC is decoded by the browser because a bundled libheif would be LGPL. The AGPL background-removal package is not a dependency, and the non-commercial RMBG-1.4 weights are not bundled. If a library's license does not fit, leave it out and say so in the tool FAQ.

## Pull request checklist

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- [ ] Light and dark both look right
- [ ] UI uses kit components and the existing tokens
- [ ] New packages are permissively licensed
- [ ] For a tool: folder layout, `toolOrder`, artwork, MCP name, `isError` on failure, both call samples, `pnpm gen:registry`, and the docs generators
- [ ] For wasm, native, or worker code: `serverExternalPackages`, `mcpNativeAssets`, and the Dockerfile copy

Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before participating.
