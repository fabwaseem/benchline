# Tool workspace

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
| `AgentSection` | Client tabs and a real `tools/call` for `https://tools.fabwaseem.com/mcp`. |
| `RelatedTools` | Up to four directory `ToolCard`s. |
| `HowItWorks` | Short steps and FAQ when the meta has them. |

```tsx
<ToolCard>
  <ToolToolbar
    label="Schema type"
    options={types}
    value={type}
    onChange={setType}
    actions={<button className="btn btn-ink h-8">Copy script</button>}
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
