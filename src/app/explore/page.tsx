import type { Metadata } from "next";
import { ExploreBrowser } from "@/components/site/explore-browser";
import { absoluteUrl } from "@/lib/site";
import { allTags, categories, tools } from "@/registry";

export const metadata: Metadata = {
  title: "Explore",
  description: "Every Benchline tool, with search, category chips, tag filters, and sort.",
  alternates: { canonical: "/explore" },
  openGraph: {
    url: absoluteUrl("/explore"),
    title: "Explore",
    description: "Every Benchline tool, with search, category chips, tag filters, and sort.",
  },
};

export default function ExplorePage() {
  return (
    <ExploreBrowser
      tools={tools.map((tool) => ({
        slug: tool.slug,
        name: tool.name,
        tagline: tool.tagline,
        category: tool.category,
        tags: tool.tags,
        updatedAt: tool.updatedAt,
        icon: tool.icon,
      }))}
      categories={categories.map((category) => ({
        slug: category.slug,
        name: category.name,
        hue: category.hue,
      }))}
      tags={allTags()}
    />
  );
}
