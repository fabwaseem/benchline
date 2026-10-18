## Summary

## Checklist

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- [ ] Checked in light and dark
- [ ] UI uses kit components and the existing tokens
- [ ] New packages are permissively licensed (no AGPL, GPL, or LGPL)

### MCP, when this adds or changes a tool

- [ ] `src/tools/<slug>/` has `meta.ts`, `tool.tsx`, pure `lib/` with vitest, and `mcp.ts`
- [ ] Slug is in `toolOrder`, and `public/tools/<slug>/cover.png` plus `logo.png` exist
- [ ] MCP name is snake_case `verb_noun`
- [ ] Failures throw, so the handler returns `isError`
- [ ] Sample added in `src/lib/mcp/endpoint.test.ts` and `scripts/live-mcp-smoke.mts`
- [ ] `pnpm gen:registry`, `pnpm gen:readme-tools`, and `pnpm gen:mcp-docs`
- [ ] Wasm, native, or worker deps are in `serverExternalPackages`, `mcpNativeAssets`, and the Dockerfile copy
