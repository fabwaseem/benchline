"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MobileCategories } from "@/components/shell/directory-frame";
import { DirectorySearch as SearchField, FilterChip, SortSelect, TagMenu, ViewToggle } from "@/components/shell/filter-bar";
import { ToolCard, ToolRow } from "@/components/shell/tool-card";
import { EmptyState } from "@/components/kit/empty-state";
import { Button } from "@/components/kit/primitives/button";
import type { DirectoryCategory } from "@/lib/catalog";
import {
  filterDirectory,
  parseDirectorySearch,
  serializeDirectorySearch,
  type DirectorySearch,
  type DirectoryTool,
  type DirectoryView,
} from "@/lib/directory";

export function DirectoryBrowser({
  tools,
  categories,
  tags,
  lockedCategory = "all",
  lockedTag,
  defaultView = "grid",
  mode = "home",
  searchPlaceholder = "Search tools",
}: {
  tools: DirectoryTool[];
  categories: DirectoryCategory[];
  tags: { slug: string; count: number }[];
  lockedCategory?: string;
  lockedTag?: string;
  defaultView?: DirectoryView;
  mode?: "home" | "embedded";
  searchPlaceholder?: string;
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const parsed = useMemo(() => parseDirectorySearch(params), [params]);
  const view = parsed.view ?? defaultView;
  const tag = lockedTag ?? parsed.tag;
  const inputRef = useRef<HTMLInputElement>(null);
  const queryTimer = useRef<number | null>(null);
  const [draft, setDraft] = useState(parsed.query);
  const [epoch, setEpoch] = useState(0);
  const [seenQuery, setSeenQuery] = useState(parsed.query);
  const [seenEpoch, setSeenEpoch] = useState(0);
  if (parsed.query !== seenQuery) {
    setSeenQuery(parsed.query);
    if (epoch === seenEpoch) setDraft(parsed.query);
    setSeenEpoch(epoch);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      const typing = target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function write(next: Partial<DirectorySearch>) {
    const merged: DirectorySearch = {
      query: next.query ?? draft,
      tag: lockedTag ? "all" : (next.tag ?? parsed.tag),
      browser: next.browser ?? parsed.browser,
      mcp: next.mcp ?? parsed.mcp,
      fresh: next.fresh ?? parsed.fresh,
      sort: next.sort ?? parsed.sort,
      view: next.view === undefined ? parsed.view : next.view,
    };
    const search = serializeDirectorySearch(merged, defaultView);
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  }

  const results = useMemo(
    () =>
      filterDirectory(tools, {
        query: draft,
        category: lockedCategory,
        tag,
        browser: parsed.browser,
        mcp: parsed.mcp,
        fresh: parsed.fresh,
        sort: parsed.sort,
      }),
    [draft, lockedCategory, parsed.browser, parsed.fresh, parsed.mcp, parsed.sort, tag, tools],
  );

  const filtering = Boolean(draft.trim() || parsed.browser || parsed.mcp || parsed.fresh || (tag !== "all" && !lockedTag));
  const heading = !filtering && parsed.sort === "popular" ? "Popular" : "Results";

  return (
    <div className={mode === "home" ? "px-4 py-6 lg:px-8" : "px-4 pt-5 pb-8 lg:px-8"}>
      {mode === "home" ? (
        <header className="mb-5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-[28px] font-semibold tracking-[-0.04em]">All tools</h1>
            <p className="text-[14px] text-muted-foreground" aria-live="polite">
              {results.length} {results.length === 1 ? "tool" : "tools"}
            </p>
          </div>
          <p className="mt-1 max-w-[62ch] text-[14px] text-muted-foreground">
            Free tools that run in your browser. Search, filter, and open one. Files stay on this device unless a tool says it fetches a public URL.
          </p>
        </header>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <MobileCategories categories={categories} total={tools.length} active={lockedCategory} />
        <SearchField
          value={draft}
          onChange={(query) => {
            setDraft(query);
            setEpoch((value) => value + 1);
            if (queryTimer.current) window.clearTimeout(queryTimer.current);
            queryTimer.current = window.setTimeout(() => write({ query }), 80);
          }}
          placeholder={searchPlaceholder}
          inputRef={inputRef}
        />
        <FilterChip pressed={parsed.browser} onClick={() => write({ browser: !parsed.browser })}>
          In browser
        </FilterChip>
        <FilterChip pressed={parsed.mcp} onClick={() => write({ mcp: !parsed.mcp })}>
          MCP ready
        </FilterChip>
        <FilterChip pressed={parsed.fresh} onClick={() => write({ fresh: !parsed.fresh })}>
          New
        </FilterChip>
        {lockedTag ? (
          <Link href="/" className="inline-flex h-8 items-center rounded-lg border border-brand-text bg-[color-mix(in_oklch,var(--accent-brand)_10%,var(--surface))] px-2.5 font-mono text-[12px]">
            #{lockedTag}
            <span className="sr-only">Clear tag</span>
            <span aria-hidden className="ml-1.5 text-faint">×</span>
          </Link>
        ) : (
          <TagMenu tags={tags} value={parsed.tag} onChange={(next) => write({ tag: next })} />
        )}
        <div className="ml-auto flex items-center gap-2">
          <SortSelect value={parsed.sort} onChange={(sort) => write({ sort })} />
          <ViewToggle value={view} onChange={(next) => write({ view: next })} />
        </div>
      </div>

      <div className="mt-6">
        {mode === "home" && heading === "Popular" && results.length > 0 ? (
          <section className="mb-8">
            <h2 className="mb-3 text-[15px] font-medium tracking-[-0.02em]">Popular</h2>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {results.slice(0, 8).map((tool) => (
                <div key={tool.slug} className="w-[260px] shrink-0">
                  <ToolCard tool={tool} />
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {mode === "home" ? <h2 className="mb-3 text-[15px] font-medium tracking-[-0.02em]">{heading === "Popular" ? "All tools" : heading}</h2> : (
          <p className="mb-3 text-[13px] text-muted-foreground" aria-live="polite">
            {results.length} {results.length === 1 ? "tool" : "tools"}
          </p>
        )}
        {results.length === 0 ? (
          <EmptyState
            title="No tools match"
            hint="Try another word, or clear the filters."
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDraft("");
                  setEpoch((value) => value + 1);
                  write({ query: "", tag: "all", browser: false, mcp: false, fresh: false, sort: "popular", view: null });
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : view === "grid" ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {results.map((tool) => (
              <ToolRow key={tool.slug} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
