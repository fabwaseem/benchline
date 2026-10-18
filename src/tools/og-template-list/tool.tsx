"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/kit/copy-button";
import { Button } from "@/components/kit/primitives/button";
import { Pane, StatusStrip, ToolCard, ToolPanes } from "@/components/kit/shell";
import { listOgTemplates, ogTemplateCategories, type ListedOgTemplate } from "@/tools/og-template-list/lib/list";

type Category = ListedOgTemplate["category"] | "all";

export default function OgTemplateListTool() {
  const [category, setCategory] = useState<Category>("all");
  const rows = useMemo(() => listOgTemplates(category === "all" ? undefined : category), [category]);

  return (
    <ToolCard>
      <ToolPanes>
        <Pane label="Category">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Template category">
            <Button type="button" size="sm" variant={category === "all" ? "solid" : "outline"} onClick={() => setCategory("all")}>
              All
            </Button>
            {ogTemplateCategories.map((item) => (
              <Button key={item} type="button" size="sm" variant={category === item ? "solid" : "outline"} onClick={() => setCategory(item)}>
                {item}
              </Button>
            ))}
          </div>
        </Pane>
        <Pane label="Templates">
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li key={row.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[14px] font-medium">{row.name}</span>
                    <span className="font-mono text-[12px] text-faint">{row.id}</span>
                  </div>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    {row.category} · {row.fields.map((field) => field.label).join(", ")}
                  </p>
                </div>
                <CopyButton value={row.id} label="Copy id" />
              </li>
            ))}
          </ul>
        </Pane>
      </ToolPanes>
      <StatusStrip note={`${rows.length} ${rows.length === 1 ? "template" : "templates"}`} tone="pass" />
    </ToolCard>
  );
}
