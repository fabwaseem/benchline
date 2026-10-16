"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Fuse from "fuse.js";
import { categories } from "@/registry/categories";
import { allTags, tools } from "@/registry";
import { Cover } from "@/components/site/cover";
import { classifyPaste } from "@/lib/paste";

export function SearchView() {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [query, setQuery] = useState(initial);
  const [category, setCategory] = useState("all");
  const [localOnly, setLocalOnly] = useState(false);
  const kind = classifyPaste(query);

  const fuse = useMemo(
    () =>
      new Fuse(tools, {
        keys: ["name", "tagline", "description", "tags", "keywords"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [],
  );
  const results = useMemo(() => {
    const base = query.trim()
      ? fuse.search(query.trim()).map((row) => ({ tool: row.item }))
      : tools.map((tool) => ({ tool }));
    return base.filter(({ tool }) => {
      if (category !== "all" && tool.category !== category) return false;
      if (localOnly && !tool.runsLocally) return false;
      return true;
    });
  }, [query, category, localOnly, fuse]);

  const grouped = categories
    .map((cat) => ({ cat, items: results.filter((row) => row.tool.category === cat.slug) }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="page-x pb-20">
      <header className="py-12">
        <p className="eyebrow">Search</p>
        <h1 className="d2 mt-3">Find a tool.</h1>
      </header>
      <label className="plate grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-full py-2 pr-2 pl-5 shadow-[var(--in-hi),0_0_0_1px_var(--border)]">
        <span className="font-mono text-[11px] text-faint">/</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name, tag, or paste a JWT, cron, URL, JSON…"
          className="h-11 bg-transparent text-[16px] outline-none placeholder:text-faint"
          autoFocus
        />
        <span className="font-mono text-[11px] text-faint">{results.length}</span>
      </label>
      {kind && query.trim() ? (
        <p className="mt-3 font-mono text-[12px] text-muted-foreground">
          Looks like {kind}.{" "}
          <Link
            href={
              kind === "jwt"
                ? "/t/jwt-decoder"
                : kind === "cron"
                  ? "/t/cron-expression-builder"
                  : kind === "url"
                    ? "/t/meta-tags-inspector"
                    : "/t/schema-generator"
            }
            className="text-brand"
          >
            Open the matching tool
          </Link>
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" data-on={category === "all"} className="chip" onClick={() => setCategory("all")}>
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            data-on={category === cat.slug}
            className="chip"
            onClick={() => setCategory(cat.slug)}
          >
            {cat.name}
          </button>
        ))}
        <button type="button" data-on={localOnly} className="chip" onClick={() => setLocalOnly((v) => !v)}>
          In the browser
        </button>
      </div>

      <div className="mt-8 grid gap-10">
        {grouped.map((group) => (
          <section key={group.cat.slug}>
            <h2 className="font-mono text-[11px] tracking-[0.14em] text-faint uppercase">{group.cat.name}</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {group.items.map(({ tool }) => {
                const cat = categories.find((item) => item.slug === tool.category);
                return (
                  <li key={tool.slug}>
                    <Link href={`/t/${tool.slug}`} className="card grid grid-cols-[auto_1fr] gap-3 p-4">
                      <Cover icon={tool.icon} hue={cat?.hue ?? 200} size={48} />
                      <span>
                        <span className="block text-[16px] font-medium">{tool.name}</span>
                        <span className="mt-1 block text-[13.5px] text-muted-foreground">{tool.description}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {results.length === 0 ? (
          <p className="text-muted-foreground">Nothing matches. Try a category chip or a shorter query.</p>
        ) : null}
      </div>

      <section className="mt-12">
        <h2 className="font-mono text-[11px] tracking-[0.14em] text-faint uppercase">Tags</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {allTags()
            .slice(0, 16)
            .map((tag) => (
              <Link key={tag.slug} href={`/tags/${tag.slug}`} className="chip">
                {tag.slug}
                <span className="font-mono text-faint">{tag.count}</span>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
