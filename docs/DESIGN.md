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
