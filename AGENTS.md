# AGENTS.md

- pnpm only. Add packages with `pnpm add <pkg>` (latest), shadcn components with `pnpm dlx shadcn@latest add`. Never hand-pin versions.
- New tool = new folder `src/tools/<slug>/` with `meta.ts`, `tool.tsx`, `lib/`, and `mcp.ts`. Run `pnpm gen:registry`. Never import tool UI from directory pages.
- Every new or changed tool ships a working MCP handler. `mcp.ts` exports zod input and output schemas, a snake_case `verb_noun` name, and `run` over the pure `lib/`. File inputs accept base64 or a public URL (private addresses blocked, 10 MB cap). `src/lib/mcp/coverage.test.ts` fails if a registered tool has no handler or an invalid schema. `src/lib/mcp/endpoint.test.ts` calls `tools/list` and one `tools/call` per tool through `/mcp`. Add a sample there for the new tool.
- Artwork: `public/tools/<slug>/cover.png` (1600x900, used for Open Graph) and `logo.png` (256x256, used on cards and the tool page). Both are required; a test checks them.
- Logic in `lib/` is pure and unit tested (vitest).
- Use `components/kit` building blocks; do not restyle primitives ad hoc. Tokens only, no raw hex.
- TypeScript strict, no `any`. `pnpm lint && pnpm typecheck && pnpm build` must pass.
- Commits: author AND committer `Waseem Anjum <66861984+fabwaseem@users.noreply.github.com>`, plain messages, no Co-authored-by trailers, no merge commits (rebase).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
