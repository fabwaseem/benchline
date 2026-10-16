"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, LayoutGrid, List, Search } from "lucide-react";
import { Cover } from "@/components/site/cover";
import type { SearchRecord } from "@/registry/schema";

type Filter = "all" | "fetch" | "local" | "new";
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
        if (filter === "fetch" && tool.runsLocally) return false;
        if (filter === "local" && !tool.runsLocally) return false;
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
        <div className="seg max-w-full overflow-x-auto" role="radiogroup" aria-label="Filter">
          {(
            [
              ["all", `All ${tools.length}`],
              ["fetch", "Fetches URL"],
              ["local", "In browser"],
              ["new", "New"],
            ] as const
          ).map(([value, label]) => (
            <button key={value} type="button" role="radio" aria-checked={filter === value} className={filter === value ? "on" : ""} onClick={() => setFilter(value)}>
              {label}
            </button>
          ))}
        </div>
        <label className="field hidden w-[260px] min-[700px]:flex">
          <Search size={14} strokeWidth={1.75} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter tools" className="w-full bg-transparent text-foreground outline-none" />
        </label>
        <div className="flex items-center gap-3 min-[700px]:ml-auto">
        <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="field h-[34px] w-auto bg-transparent pr-3 text-foreground" aria-label="Sort">
          <option value="name">Name</option>
          <option value="updated">Updated</option>
        </select>
        <div className="seg">
          <button type="button" aria-pressed={!grid} className={!grid ? "on" : ""} onClick={() => setGrid(false)} aria-label="List">
            <List size={14} strokeWidth={1.75} />
          </button>
          <button type="button" aria-pressed={grid} className={grid ? "on" : ""} onClick={() => setGrid(true)} aria-label="Grid">
            <LayoutGrid size={14} strokeWidth={1.75} />
          </button>
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
          <div className="hidden grid-cols-[52px_minmax(0,1.2fr)_minmax(0,2.2fr)_150px_110px_36px] gap-4 bg-well px-5 py-3 font-mono text-[11px] tracking-[0.07em] text-faint uppercase min-[900px]:grid">
            <span />
            <span>Tool</span>
            <span>What it does</span>
            <span>Data</span>
            <span>Status</span>
            <span />
          </div>
          {rows.map((tool) => (
            <Link key={tool.slug} href={`/t/${tool.slug}`} className="grid grid-cols-[44px_minmax(0,1fr)_30px] items-center gap-4 border-t border-border px-4 py-3.5 min-[900px]:grid-cols-[52px_minmax(0,1.2fr)_minmax(0,2.2fr)_150px_110px_36px] min-[900px]:px-5">
              <Cover hue={hue} icon={tool.icon} size={40} />
              <span className="min-w-0">
                <span className="block font-semibold tracking-[-0.015em]">{tool.name}</span>
                <span className="font-mono text-[12px] text-faint">{tool.slug}</span>
              </span>
              <span className="hidden text-[13.5px] text-muted-foreground min-[900px]:block">{tool.tagline}</span>
              <span className="chip hidden min-[900px]:inline-flex">
                <span className={tool.runsLocally ? "dot" : "dot dot-warn"} />
                {tool.runsLocally ? "In browser" : "Fetches URL"}
              </span>
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
