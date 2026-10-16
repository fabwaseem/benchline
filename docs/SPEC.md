# SPEC — tools.fabwaseem.com (repo fabwaseem/fabwaseem-tools)

Goal: a premium, scalable tools directory (thousands of tools). New brand/design, NOT the portfolio's UI. Read docs/ARCHITECTURE.md, docs/DESIGN.md, AGENTS.md in the repo (copied below).

## Deliverables (one PR to main, rebase-mergeable)
1. Design system: implement DESIGN.md tokens in globals.css (light+dark, next-themes), Geist fonts, themed shadcn primitives, components/kit set.
2. Registry: zod schema, categories, gen-registry script (`pnpm gen:registry`, run in prebuild), loaders with next/dynamic, build-time validation.
3. Pages: home (hero search, ⌘K, category + tag filters, featured/new), /[category], /tags/[tag], /t/[slug] (breadcrumbs, tool, how-to, FAQ accordion, related), about. sitemap.ts, robots.ts, /llms.txt, JSON-LD, per-tool OG via next/og. `output: "standalone"`.
4. Migrate all 10 tools, rebuilt from scratch with the new UI and complete functionality: og-image-generator, llms-txt-generator, ai-seo-checker, jwt-decoder (incl. signature verification HS/RS/ES via jose, no warning box), robots-txt-checker, meta-tags-inspector, schema-generator, ai-token-counter (tokenizer in a web worker, cacheable asset), cron-expression-builder, nextjs-dockerfile-generator. Reuse only correct pure logic from github.com/fabwaseem/fabwaseem-portfolio (src tools libs); never its UI. Network-needing tools (seo checker, meta inspector, robots checker) use route handlers with SSRF protection + timeouts.
5. vitest for lib logic. lint/typecheck/build green. Screenshots light/dark 1440 + 375 in PR.

## Rules
- Add deps only via `pnpm add` / `pnpm dlx shadcn@latest add` (latest). 
- Commits authored AND committed as Waseem Anjum <66861984+fabwaseem@users.noreply.github.com>, plain messages, no Co-authored-by, no merge commits.
- Don't touch the portfolio repo, DNS, or Coolify.

---
# Architecture

Stack: Next.js 16 (App Router, Turbopack, RSC), React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui (base-nova style, Base UI primitives) with a custom theme, zod 4, next-themes, fuse.js, lucide-react, pnpm.

## Layout
```
src/
  app/
    page.tsx                      directory home: search, category + tag filters
    [category]/page.tsx           category pages (SSG via generateStaticParams)
    tags/[tag]/page.tsx           tag pages (SSG)
    t/[slug]/page.tsx             tool page shell (SSG); loads tool UI lazily
    t/[slug]/opengraph-image.tsx  per-tool OG image (next/og)
    sitemap.ts robots.ts llms.txt/route.ts
  tools/<slug>/
    meta.ts       ToolMeta (validated by zod schema)
    tool.tsx      "use client" UI, default export
    lib/*.ts      pure logic + lib/*.test.ts
    content.mdx?  optional long-form explainer
  registry/
    schema.ts     zod ToolMeta, Category, Tag schemas
    categories.ts category list (slug, name, description, icon)
    index.ts      imports every meta.ts (metadata only, never UI), validates at build
    loaders.ts    generated map slug -> () => import("@/tools/<slug>/tool")
  components/ui      shadcn primitives (themed)
  components/kit     tool-building blocks: ToolShell, Panel, CodeOutput, Dropzone,
                     Segmented, CopyButton, DownloadButton, FieldRow, ResultStat, FaqAccordion
  components/site    header, footer, search (cmdk), cards, filters, breadcrumbs
scripts/gen-registry.ts  scans src/tools/*/meta.ts -> writes registry index + loaders
```

## Scaling rules
- Registry imports only `meta.ts`. Tool UI is reached only through `loaders.ts` with `next/dynamic`, so each tool is its own chunk and the directory pages never ship tool code.
- Pages are SSG from the registry; search index is a small generated JSON (slug, name, description, tags, category) loaded client-side by fuse.js.
- Heavy deps (tokenizers, image libs) are imported inside the tool module only, ideally in workers.
- Build fails if any meta is invalid, a slug is duplicated, or a related tool / category / tag is unknown.

## ToolMeta fields
slug, name, tagline, description, category, tags[], keywords[], status (stable|beta|new|deprecated), createdAt, updatedAt, icon (lucide name), accent?, related[], faqs[{q,a}], seo {title, description, ogTitle?}, howTo steps[], inputs/outputs summary, runsLocally (bool, privacy badge).

## SEO
Metadata API per page, canonical https://tools.fabwaseem.com, JSON-LD (WebApplication/SoftwareApplication + FAQPage + BreadcrumbList on tool pages, CollectionPage + ItemList on directory pages), sitemap from registry, robots, /llms.txt generated from registry.

## Deploy
Coolify (Nixpacks or Dockerfile with `output: "standalone"`), domain tools.fabwaseem.com.

---
# Design brief — "Toolsmith" (working name; tools.fabwaseem.com)

Deliberately different from the portfolio (dark, editorial). Toolsmith feels like a precise instrument: light-first, calm, dense where useful, workbench metaphor.

## Palette (OKLCH tokens in globals.css, both themes)
- Light: paper `oklch(0.985 0.004 95)`, surface white, ink `oklch(0.22 0.02 260)`, muted `oklch(0.55 0.015 260)`, hairline `oklch(0.91 0.006 95)`.
- Dark: graphite `oklch(0.17 0.012 260)`, surface `oklch(0.21 0.012 260)`, ink `oklch(0.96 0.005 95)`.
- Primary: signal cobalt `oklch(0.55 0.2 262)`; secondary accent: amber `oklch(0.8 0.15 75)` for highlights/status "new".
- Category hues: each category gets a hue token used for icon tiles and chips only.

## Type
- UI/display: Geist Sans (tight tracking on headings), numerals tabular.
- Code/output: Geist Mono.

## Components
Themed shadcn primitives + kit: ToolShell (header, privacy badge, input/output split panes, actions bar), Segmented (single-row, never wraps; scrolls horizontally), CodeOutput (single scroll container, line numbers, copy/download), Dropzone, FieldRow (label/help/error spacing scale), ResultStat, EmptyState, FaqAccordion, CommandK search, ToolCard, CategoryTile, TagChip.

## UX principles
1. Instant: results update live, no submit buttons unless network is required.
2. Private by default: runs in the browser; show "Runs locally" badge.
3. One scroll per surface; no nested scrollbars.
4. Keyboard first: ⌘K search everywhere, shortcuts for copy/clear.
5. Consistent spacing scale (4px base), 8/12/16/24 rhythm; labels 6px above fields.
6. Accessible: WCAG AA, focus rings, reduced-motion respected.
7. Mobile: panes stack, controls stay single-row.

---
# AGENTS.md

- pnpm only. Add packages with `pnpm add <pkg>` (latest), shadcn components with `pnpm dlx shadcn@latest add`. Never hand-pin versions.
- New tool = new folder `src/tools/<slug>/` with `meta.ts`, `tool.tsx`, `lib/`. Run `pnpm gen:registry`. Never import tool UI from directory pages.
- Logic in `lib/` is pure and unit tested (vitest).
- Use `components/kit` building blocks; do not restyle primitives ad hoc. Tokens only, no raw hex.
- TypeScript strict, no `any`. `pnpm lint && pnpm typecheck && pnpm build` must pass.
- Commits: author AND committer `Waseem Anjum <66861984+fabwaseem@users.noreply.github.com>`, plain messages, no Co-authored-by trailers, no merge commits (rebase).
