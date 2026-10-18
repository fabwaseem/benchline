# Tool workspace

Use these components only. Do not render a raw `button`, `input`, `select`, `textarea`, color input, or file input, and do not import `@base-ui/react` outside this folder. The headless package is `@base-ui/react` (MIT). Variants use `cva` and Benchline CSS variables. Control heights are 28 / 32 / 40. Radii are 4px on controls and 6px on cards.

Interactive primitives live in `primitives/` (Button, IconButton, Toggle, Segmented control, Input, Textarea, NumberInput, Field, Select, Combobox, DropdownMenu, ContextMenu, Checkbox, RadioGroup, Switch, Slider, ColorPicker, Popover, Tooltip, Dialog, AlertDialog, Sheet, Drawer, Toast, Accordion, Collapsible, ScrollArea, Separator, Badge, Kbd, Skeleton, Spinner, Progress, Card, Table). Uploaders live in `upload/` and share `useFileDrop`: Dropzone, FileUpload, MultiFileList, ImageUpload, PdfUpload, CompactFilePill, LogoDrop.

`/kit` renders every variant and state in light and dark. It is dev-only, noindex, and left out of the sitemap.

Tool pages use these pieces. A tool renders a card. The page around it (`src/app/t/[slug]/page.tsx`) renders the header, the agent block, related tools, and the how-it-works section.

| Component | Role |
| --- | --- |
| `ToolPage` | Centered page, max 1240px. No sidebar and no right rail. |
| `ToolHeader` | Breadcrumb, icon, title, description, runtime chip, MCP name, Share, Use via MCP. |
| `ToolCard` | Bordered workspace. This is not the directory card in `src/components/shell/tool-card.tsx`. |
| `ToolToolbar` | Mode tabs on the left. Tabs that do not fit go into a More menu. Actions sit on the right. |
| `ToolPanes` | Two panes. `ratio` is `50/50` (default), `40/60`, `35/65`, or `60/40`. Panes stack under 900px. |
| `Pane` | Label, optional actions, and a body. Labels stay on one line. |
| `StatusStrip` | Full-width pass / warn / fail pills under the panes. |
| `ResultsTable` | One row per check: badge, name, explanation. Filters are All, Fail, Warn, and Pass. |
| `ScoreCard` | Score ring, verdict, and short stats. Pair it with `ResultsTable` for checkers. |
| `AgentSection` | Client tabs and a real `tools/call` for `https://benchline.fabwaseem.com/mcp`. |
| `RelatedTools` | Up to four directory `ToolCard`s. |
| `HowItWorks` | Short steps and FAQ when the meta has them. |

```tsx
<ToolCard>
  <ToolToolbar
    label="Schema type"
    options={types}
    value={type}
    onChange={setType}
    actions={<Button variant="solid" size="sm">Copy script</Button>}
  />
  <ToolPanes ratio="50/50">
    <Pane label="Fields">{fields}</Pane>
    <Pane label="Output" padded={false} scroll={false}>
      <CodeOutput code={code} fill chrome={false} />
    </Pane>
  </ToolPanes>
  <StatusStrip items={checks} />
</ToolCard>
```

Checkers (AI SEO, robots.txt, meta tags) use `ratio="35/65"`: a `ScoreCard` on the left and a `ResultsTable` on the right. Previews (Open Graph, images, QR) use `40/60` or `35/65` so the preview is the wider pane.

Do not add a third column. Put options in the input pane, extra output in the output pane, and short validation in `StatusStrip`.

Chips wrap inside a pane (`flex flex-wrap`). Do not give a tab row or a chip row a horizontal scrollbar. Long values use `Truncate` so the full string is on the `title` tooltip.
