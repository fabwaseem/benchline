import type { Metadata } from "next";
import Link from "next/link";
import { DirectoryFrame } from "@/components/shell/directory-frame";
import { Cover } from "@/components/site/cover";
import { directoryCatalog } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse Benchline tools by category.",
  alternates: { canonical: "/categories" },
  openGraph: {
    url: absoluteUrl("/categories"),
    title: "Categories",
    description: "Browse Benchline tools by category.",
  },
};

export default function CategoriesPage() {
  const { categories, tools } = directoryCatalog();
  return (
    <DirectoryFrame categories={categories} total={tools.length} active="categories">
      <div className="px-4 py-6 lg:px-8">
        <h1 className="text-[28px] font-semibold tracking-[-0.04em]">Categories</h1>
        <p className="mt-1 max-w-[62ch] text-[14px] text-muted-foreground">
          {categories.length} categories. {tools.length} tools.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/${category.slug}`}
              className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-colors duration-150 hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Cover hue={category.hue} icon={category.icon} size={40} />
              <span className="min-w-0">
                <span className="block text-[15px] font-medium tracking-[-0.02em]">{category.name}</span>
                <span className="mt-1 line-clamp-2 block text-[13px] leading-5 text-muted-foreground">{category.description}</span>
                <span className="mt-2 block font-mono text-[12px] text-faint">{category.count} {category.count === 1 ? "tool" : "tools"}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </DirectoryFrame>
  );
}
