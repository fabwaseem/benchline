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
