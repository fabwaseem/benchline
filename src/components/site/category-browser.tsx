"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, LayoutGrid, List, Search } from "lucide-react";
import { Select } from "@/components/kit/controls";
import { Input } from "@/components/kit/primitives/input";
import { Toggle } from "@/components/kit/primitives/toggle";
import { Segmented } from "@/components/kit/segmented";
import { Cover } from "@/components/site/cover";
import type { SearchRecord } from "@/registry/schema";

type Filter = "all" | "new";
type Sort = "name" | "updated";

export function CategoryBrowser({
  tools,
  hue,
  updated,
}: {
  tools: (SearchRecord & { updatedAt: string })[];
  hue: number;
  updated: Record<string, string>;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("name");
  const [query, setQuery] = useState("");
  const [grid, setGrid] = useState(false);
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tools
      .filter((tool) => {
        if (filter === "new" && tool.status !== "new") return false;
        if (!needle) return true;
        return `${tool.name} ${tool.tagline} ${tool.slug}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => (sort === "updated" ? (updated[b.slug] ?? "").localeCompare(updated[a.slug] ?? "") : a.name.localeCompare(b.name)));
  }, [filter, query, sort, tools, updated]);

  return (
    <>
      <div className="sticky top-[60px] z-[5] border-b border-border bg-background">
      <div className="page-x flex flex-col gap-3 py-3 min-[700px]:flex-row min-[700px]:flex-wrap min-[700px]:items-center">
        <Segmented
          label="Filter"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: `All ${tools.length}` },
            { value: "new", label: "New" },
          ]}
        />
        <div className="hidden w-[260px] min-[700px]:block">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter tools" aria-label="Filter tools" prefix={<Search size={14} strokeWidth={1.75} />} />
        </div>
        <div className="flex items-center gap-3 min-[700px]:ml-auto">
        <Select value={sort} onChange={(event) => setSort(event.target.value as Sort)} aria-label="Sort" className="w-auto">
          <option value="name">Name</option>
          <option value="updated">Updated</option>
        </Select>
        <div className="inline-flex h-control-md overflow-hidden rounded-sm border border-border" role="group" aria-label="Layout">
          <Toggle pressed={!grid} onPressedChange={() => setGrid(false)} aria-label="List" className="grid h-control-md w-control-md place-items-center rounded-none">
            <List size={14} strokeWidth={1.75} />
          </Toggle>
          <Toggle pressed={grid} onPressedChange={() => setGrid(true)} aria-label="Grid" className="grid h-control-md w-control-md place-items-center rounded-none border-l border-border">
            <LayoutGrid size={14} strokeWidth={1.75} />
          </Toggle>
        </div>
        </div>
      </div>
      </div>
      {grid ? (
        <div className="page-x grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((tool) => (
            <Link key={tool.slug} href={`/t/${tool.slug}`} className="card flex flex-col gap-3 p-5">
              <Cover hue={hue} icon={tool.icon} size={40} />
              <div className="text-[15px] font-semibold tracking-[-0.02em]">{tool.name}</div>
              <p className="text-[13px] text-muted-foreground">{tool.tagline}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="page-x">
        <div className="card my-8 overflow-hidden">
          <div className="hidden grid-cols-[52px_minmax(0,1.2fr)_minmax(0,2.2fr)_110px_36px] gap-4 bg-well px-5 py-3 font-mono text-[11px] tracking-[0.07em] text-faint uppercase min-[900px]:grid">
            <span />
            <span>Tool</span>
            <span>What it does</span>
            <span>Status</span>
            <span />
          </div>
          {rows.map((tool) => (
            <Link key={tool.slug} href={`/t/${tool.slug}`} className="grid grid-cols-[44px_minmax(0,1fr)_30px] items-center gap-4 border-t border-border px-4 py-3.5 min-[900px]:grid-cols-[52px_minmax(0,1.2fr)_minmax(0,2.2fr)_110px_36px] min-[900px]:px-5">
              <Cover hue={hue} icon={tool.icon} size={40} />
              <span className="min-w-0">
                <span className="block font-semibold tracking-[-0.015em]">{tool.name}</span>
                <span className="font-mono text-[12px] text-faint">{tool.slug}</span>
              </span>
              <span className="hidden text-[13.5px] text-muted-foreground min-[900px]:block">{tool.tagline}</span>
              <span className="hidden font-mono text-[12px] text-faint uppercase min-[900px]:inline">{tool.status}</span>
              <ArrowRight size={16} strokeWidth={1.75} className="text-faint" />
            </Link>
          ))}
          {rows.length === 0 ? <p className="px-5 py-8 text-sm text-muted-foreground">Nothing matches that filter.</p> : null}
        </div>
        </div>
      )}
    </>
  );
}
