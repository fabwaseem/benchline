"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { ChipButton } from "@/components/kit/controls";
import { CategoryTile, TagChip, ToolCard } from "@/components/site/tool-card";
import { Input } from "@/components/ui/input";
import type { Category, SearchRecord } from "@/registry/schema";

export function Directory({
  tools,
  categories,
  tags,
  lockedCategory,
  lockedTag,
  showHero = false,
}: {
  tools: SearchRecord[];
  categories: Category[];
  tags: { slug: string; count: number }[];
  lockedCategory?: string;
  lockedTag?: string;
  showHero?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(lockedCategory ?? "");
  const [tag, setTag] = useState(lockedTag ?? "");
  const names = useMemo(() => new Map(categories.map((item) => [item.slug, item.name])), [categories]);
  const fuse = useMemo(
    () =>
      new Fuse(tools, {
        keys: [
          { name: "name", weight: 0.4 },
          { name: "tagline", weight: 0.2 },
          { name: "description", weight: 0.15 },
          { name: "tags", weight: 0.15 },
          { name: "keywords", weight: 0.1 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [tools],
  );

  const filtered = useMemo(() => {
    const base = query.trim() ? fuse.search(query.trim()).map((result) => result.item) : tools;
    return base.filter((tool) => {
      if (category && tool.category !== category) return false;
      if (tag && !tool.tags.includes(tag)) return false;
      return true;
    });
  }, [category, fuse, query, tag, tools]);

  const featured = tools.filter((tool) => tool.status === "stable");
  const fresh = tools.filter((tool) => tool.status === "new");
  const filtering = Boolean(query.trim() || (category && !lockedCategory) || (tag && !lockedTag));

  return (
    <div className="flex flex-col gap-8">
      {showHero ? (
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card px-5 py-8 sm:px-8 sm:py-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--hairline) 1px, transparent 1px), linear-gradient(to bottom, var(--hairline) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              maskImage: "linear-gradient(to bottom, black, transparent)",
            }}
          />
          <div className="relative max-w-2xl">
            <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">Benchline</p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[0.95]">
              A quiet bench for exact work.
            </h1>
            <p className="mt-4 max-w-lg text-sm text-muted-foreground sm:text-base">
              Ten instruments for AI search, previews, tokens, and the files a Next.js deploy needs. Generators stay in the browser. Checkers fetch only the public URL you submit.
            </p>
            <label className="mt-6 block max-w-xl">
              <span className="sr-only">Search tools</span>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search the bench"
                className="h-11 bg-background"
              />
            </label>
            <p className="mt-2 text-xs text-muted-foreground">Press ⌘K anywhere to jump to a tool.</p>
          </div>
        </section>
      ) : null}

      {showHero ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
          {categories.map((item) => (
            <CategoryTile
              key={item.slug}
              {...item}
              count={tools.filter((tool) => tool.category === item.slug).length}
            />
          ))}
        </div>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {!lockedCategory && !lockedTag ? (
          <ChipButton
            pressed={!category && !tag}
            onClick={() => {
              setCategory("");
              setTag("");
            }}
            className="h-control-sm shrink-0 rounded-sm border border-border bg-card px-2.5 text-xs"
          >
            All
          </ChipButton>
        ) : null}
        {tags.map((item) =>
          lockedTag ? (
            <TagChip key={item.slug} tag={item.slug} count={item.count} href={`/tags/${item.slug}`} active={item.slug === lockedTag} />
          ) : (
            <ChipButton
              key={item.slug}
              pressed={tag === item.slug}
              onClick={() => setTag(tag === item.slug ? "" : item.slug)}
              className={`h-control-sm shrink-0 rounded-sm border px-2.5 text-xs whitespace-nowrap ${tag === item.slug ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
            >
              {item.slug}
              <span className="ml-1 tabular-nums opacity-70">{item.count}</span>
            </ChipButton>
          ),
        )}
      </div>

      {showHero && !filtering ? (
        <>
          <section>
            <h2 className="text-sm font-semibold tracking-tight">On the bench</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} categoryName={names.get(tool.category) ?? tool.category} />
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-sm font-semibold tracking-tight">New</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fresh.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} categoryName={names.get(tool.category) ?? tool.category} />
              ))}
            </div>
          </section>
        </>
      ) : null}

      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-tight">{filtering || !showHero ? "Tools" : "All instruments"}</h2>
          <p className="text-xs text-muted-foreground tabular-nums">{filtered.length}</p>
        </div>
        {filtered.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nothing on the bench matches that.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} categoryName={names.get(tool.category) ?? tool.category} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
