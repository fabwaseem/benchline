# AGENTS.md

- pnpm only. Add packages with `pnpm add <pkg>` (latest), shadcn components with `pnpm dlx shadcn@latest add`. Never hand-pin versions.
- New tool = new folder `src/tools/<slug>/` with `meta.ts`, `tool.tsx`, `lib/`. Run `pnpm gen:registry`. Never import tool UI from directory pages.
- Artwork: `public/tools/<slug>/cover.png` (1600x900, used for Open Graph) and `logo.png` (256x256, used on cards and the tool page). Both are required; a test checks them.
- Logic in `lib/` is pure and unit tested (vitest).
- Use `components/kit` building blocks; do not restyle primitives ad hoc. Tokens only, no raw hex.
- TypeScript strict, no `any`. `pnpm lint && pnpm typecheck && pnpm build` must pass.
- Commits: author AND committer `Waseem Anjum <66861984+fabwaseem@users.noreply.github.com>`, plain messages, no Co-authored-by trailers, no merge commits (rebase).
