"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/kit/primitives/button";
import { Cover } from "@/components/site/cover";
import type { Category, SearchRecord } from "@/registry/schema";

export function Explorer({
  categories,
  tools,
}: {
  categories: Category[];
  tools: SearchRecord[];
}) {
  const [active, setActive] = useState(categories[0]?.slug ?? "");
  const category = categories.find((item) => item.slug === active) ?? categories[0];
  if (!category) return null;
  const rows = tools.filter((tool) => tool.category === category.slug);
  return (
    <div className="page-x grid gap-4 min-[900px]:grid-cols-[320px_1fr] min-[900px]:gap-8">
      <div className="flex gap-2 overflow-x-auto min-[900px]:block">
        {categories.map((item, index) => {
          const on = item.slug === category.slug;
          const count = tools.filter((tool) => tool.category === item.slug).length;
          return (
            <Button
              key={item.slug}
              type="button"
              variant={on ? "secondary" : "outline"}
              onClick={() => setActive(item.slug)}
              aria-pressed={on}
              className="h-control-lg shrink-0 justify-start gap-3 rounded-sm px-3 font-medium text-muted-foreground min-[900px]:h-auto min-[900px]:w-full min-[900px]:rounded-none min-[900px]:border-x-0 min-[900px]:border-t-0 min-[900px]:px-1 min-[900px]:py-3.5 min-[900px]:text-[15px]"
            >
              <span className={on ? "hidden font-mono text-brand min-[900px]:inline" : "hidden font-mono text-faint min-[900px]:inline"} style={{ width: 22 }}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={on ? "min-[900px]:flex-1 min-[900px]:text-foreground" : "min-[900px]:flex-1"}>{item.name}</span>
              <span className="hidden font-mono text-faint min-[900px]:inline">{count}</span>
              {on ? <ChevronRight size={14} strokeWidth={1.75} className="hidden min-[900px]:inline" /> : null}
            </Button>
          );
        })}
      </div>
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-5 px-5 pt-7 pb-5 min-[700px]:px-7">
          <div>
            <div className="eyebrow">Category · {String(rows.length).padStart(2, "0")} tools</div>
            <div className="d3 mt-2.5 text-[44px]">{category.name}</div>
            <p className="mt-2 max-w-[52ch] text-muted-foreground">{category.description}</p>
          </div>
          <Link href={`/${category.slug}`} className="btn">
            View category <ArrowRight size={14} strokeWidth={1.75} />
          </Link>
        </div>
        {rows.map((tool) => (
          <Link key={tool.slug} href={`/t/${tool.slug}`} className="flex items-center gap-4 border-t border-border px-5 py-4 min-[700px]:px-7">
            <Cover hue={category.hue} icon={tool.icon} size={40} />
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-semibold tracking-[-0.015em]">{tool.name}</div>
              <div className="mt-0.5 truncate text-[13px] text-muted-foreground">{tool.tagline}</div>
            </div>
            <ArrowRight size={15} strokeWidth={1.75} className="text-faint" />
          </Link>
        ))}
      </div>
    </div>
  );
}
