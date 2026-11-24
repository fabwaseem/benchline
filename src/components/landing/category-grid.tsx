import Link from "next/link";
import { ArrowRight } from "kineticons";
import { Cover } from "@/components/site/cover";
import type { DirectoryCategory } from "@/lib/catalog";
import type { DirectoryTool } from "@/lib/directory";

export function CategoryGrid({ categories, tools }: { categories: DirectoryCategory[]; tools: DirectoryTool[] }) {
  return (
    <section aria-labelledby="categories-title" className="page-x frame py-20 md:py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Categories</p>
          <h2 id="categories-title" className="d2 mt-4 max-w-[18ch]">
            {categories.length} benches, one for each kind of job.
          </h2>
        </div>
        <Link href="/categories" className="ki-trigger arrow-nudge inline-flex items-center gap-1.5 text-[14.5px] font-medium text-brand-text focus-visible:underline focus-visible:outline-none">
          See every category
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
      <ul className="mt-12 grid gap-px overflow-hidden rounded-xl bg-border shadow-[0_0_0_1px_var(--border)] sm:grid-cols-2 lg:grid-cols-5">
        {categories.map((category) => {
          const sample = tools.filter((tool) => category.match.includes(tool.category) || category.match.includes(tool.parent)).slice(0, 3);
          return (
            <li key={category.slug} className="bg-surface">
              <Link
                href={`/${category.slug}`}
                className="ki-trigger group flex h-full flex-col p-5 transition-colors duration-150 hover:bg-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
              >
                <span className="flex items-center justify-between">
                  <Cover hue={category.hue} icon={category.icon} size={40} className="transition-transform duration-200 group-hover:-translate-y-0.5" />
                  <span className="font-mono text-[12px] text-faint tabular-nums">{String(category.count).padStart(2, "0")}</span>
                </span>
                <span className="mt-6 block text-[16px] font-semibold tracking-[-0.02em]">{category.name}</span>
                <span className="mt-2 block space-y-1">
                  {sample.map((tool) => (
                    <span key={tool.slug} className="block truncate text-[13px] text-muted-foreground">
                      {tool.name}
                    </span>
                  ))}
                </span>
                <span className="mt-auto inline-flex items-center gap-1 pt-5 text-[12.5px] font-medium text-faint transition-colors group-hover:text-brand-text">
                  Open
                  <ArrowRight size={13} aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
