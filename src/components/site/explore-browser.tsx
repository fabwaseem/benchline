"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Cover } from "@/components/site/cover";
import { exploreTools, type ExploreSort, type ExploreTool } from "@/lib/explore";

type CategoryChip = { slug: string; name: string; hue: number };
type TagChip = { slug: string; count: number };

const sorts: { value: ExploreSort; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "updated", label: "Updated" },
  { value: "category", label: "Category" },
];

export function ExploreBrowser({
  tools,
  categories,
  tags,
}: {
  tools: ExploreTool[];
  categories: CategoryChip[];
  tags: TagChip[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [tag, setTag] = useState("all");
  const [sort, setSort] = useState<ExploreSort>("name");
  const hueFor = useMemo(() => new Map(categories.map((item) => [item.slug, item.hue])), [categories]);
  const nameFor = useMemo(() => new Map(categories.map((item) => [item.slug, item.name])), [categories]);
  const rows = useMemo(
    () => exploreTools(tools, { query, category, tag, sort }, (slug) => nameFor.get(slug) ?? slug),
    [tools, query, category, tag, sort, nameFor],
  );

  return (
    <div className="page-x pb-20">
      <header className="py-10 min-[700px]:py-16">
        <p className="eyebrow">Directory</p>
        <h1 className="d2 mt-4">Every tool.</h1>
        <p className="lede mt-4 max-w-[46ch]">Search the bench, then narrow by category, tag, or the order you want them in.</p>
      </header>
      <label className="field h-12 max-w-[640px]">
        <Search size={16} strokeWidth={1.75} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tools"
          aria-label="Search tools"
          className="w-full bg-transparent text-[15px] text-foreground outline-none"
        />
      </label>
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Category">
        <FilterChip on={category === "all"} onClick={() => setCategory("all")}>All</FilterChip>
        {categories.map((item) => (
          <FilterChip key={item.slug} on={category === item.slug} onClick={() => setCategory(item.slug)}>
            {item.name}
          </FilterChip>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Tag">
        <FilterChip on={tag === "all"} onClick={() => setTag("all")}>All tags</FilterChip>
        {tags.map((item) => (
          <FilterChip key={item.slug} on={tag === item.slug} onClick={() => setTag(item.slug)}>
            #{item.slug}
          </FilterChip>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <label className="text-[13px] text-muted-foreground">
          Sort
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as ExploreSort)}
            className="field ml-2 h-[34px] w-auto bg-transparent pr-3 text-foreground"
            aria-label="Sort"
          >
            {sorts.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
        <span className="font-mono text-[12px] text-faint">{rows.length} {rows.length === 1 ? "tool" : "tools"}</span>
      </div>
      {rows.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">Nothing matches that filter.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((tool) => (
            <Link key={tool.slug} href={`/t/${tool.slug}`} className="card flex flex-col gap-3 p-5">
              <Cover hue={hueFor.get(tool.category) ?? 200} icon={tool.icon} size={40} />
              <div>
                <div className="text-[15px] font-semibold tracking-[-0.02em]">{tool.name}</div>
                <div className="mt-1 font-mono text-[12px] text-faint">{nameFor.get(tool.category) ?? tool.category}</div>
              </div>
              <p className="text-[13px] text-muted-foreground">{tool.tagline}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="chip" data-on={on ? "true" : undefined} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}
