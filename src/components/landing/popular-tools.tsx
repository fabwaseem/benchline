import Link from "next/link";
import { ArrowRight } from "kineticons";
import { ToolCard } from "@/components/shell/tool-card";
import type { DirectoryTool } from "@/lib/directory";

export function PopularTools({ tools, total }: { tools: DirectoryTool[]; total: number }) {
  return (
    <section aria-labelledby="popular-title" className="border-t border-border bg-well">
      <div className="page-x frame py-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Most opened</p>
            <h2 id="popular-title" className="d2 mt-4 max-w-[16ch]">
              Start with what people use most.
            </h2>
          </div>
          <Link
            href="/tools"
            className="ki-trigger arrow-nudge inline-flex h-control-lg items-center gap-2 rounded-md bg-brand px-5 text-[14.5px] font-semibold text-brand-foreground transition-[transform,background-color] duration-150 active:translate-y-px focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            See all {total} tools
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <li key={tool.slug} className="min-w-0">
              <ToolCard tool={tool} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
