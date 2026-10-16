import type { Metadata } from "next";
import Link from "next/link";
import { Cover } from "@/components/site/cover";
import { absoluteUrl } from "@/lib/site";
import { categories, toolsInCategory } from "@/registry";

export const metadata: Metadata = {
  title: "Categories",
  description: "Every Benchline category, with its hue, icon, description, and the tools that live in it.",
  alternates: { canonical: "/categories" },
  openGraph: {
    url: absoluteUrl("/categories"),
    title: "Categories",
    description: "Every Benchline category, with its hue, icon, description, and the tools that live in it.",
  },
};

export default function CategoriesPage() {
  return (
    <div className="page-x pb-20">
      <header className="py-10 min-[700px]:py-16">
        <p className="eyebrow">Directory</p>
        <h1 className="d2 mt-4">Categories.</h1>
        <p className="lede mt-4 max-w-[48ch]">
          Each category has a hue, an icon, and the tools that belong there.
        </p>
      </header>
      <div className="grid gap-4">
        {categories.map((category) => {
          const list = toolsInCategory(category.slug);
          const top = list.slice(0, 3);
          return (
            <article key={category.slug} className="card grid gap-6 p-5 min-[800px]:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] min-[800px]:p-7">
              <div>
                <Cover hue={category.hue} icon={category.icon} size={48} />
                <h2 className="mt-4 text-[22px] font-semibold tracking-[-0.03em]">
                  <Link href={`/${category.slug}`} className="hover:underline">
                    {category.name}
                  </Link>
                </h2>
                <p className="mt-2 max-w-[46ch] text-[14px] leading-relaxed text-muted-foreground">{category.description}</p>
                <p className="mt-4 font-mono text-[12px] text-faint">
                  hue {category.hue}
                  <span className="mx-2 text-border">·</span>
                  {String(list.length).padStart(2, "0")} {list.length === 1 ? "tool" : "tools"}
                </p>
              </div>
              <ul className="flex flex-col justify-center gap-1">
                {top.map((tool) => (
                  <li key={tool.slug}>
                    <Link href={`/t/${tool.slug}`} className="flex items-center gap-3 rounded-[10px] px-2 py-2 hover:bg-well">
                      <Cover hue={category.hue} icon={tool.icon} size={32} />
                      <span className="min-w-0">
                        <span className="block text-[14px] font-semibold tracking-[-0.02em]">{tool.name}</span>
                        <span className="block truncate text-[12.5px] text-muted-foreground">{tool.tagline}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
