import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "schema-generator",
  name: "JSON-LD schema generator",
  tagline: "Fill a form, get valid schema.org JSON-LD for Article, FAQ, Product, Organization, and more.",
  description:
    "Free JSON-LD schema markup generator. Build Article, BlogPosting, FAQPage, HowTo, Product, Organization, Person, LocalBusiness, BreadcrumbList, SoftwareApplication, WebSite, and Event schema, then copy the script tag or a Next.js component.",
  category: "seo",
  tags: ["json-ld", "seo"],
  keywords: ["JSON-LD generator", "schema markup generator", "FAQ schema", "structured data", "schema.org"],
  status: "new",
  createdAt: "2026-09-12",
  updatedAt: "2026-10-16",
  icon: "Braces",
  related: ["ai-seo-checker", "meta-tags-inspector", "llms-txt-generator", "og-image-generator"],
  faqs: [
    { q: "What is JSON-LD?", a: "JSON-LD is a JSON format for schema.org facts. A script tag with type application/ld+json tells crawlers the page's type, author, dates, price, or questions without making them guess from the prose." },
    { q: "Where do I put the script tag?", a: "In the page head or body. Google reads either. In the Next.js App Router, render it from a server component. One page can carry more than one script." },
    { q: "Does schema help AI search?", a: "It makes entities and facts explicit and machine-readable, which helps a system that quotes the page. It does not guarantee a citation." },
    { q: "Which types get Google rich results in 2026?", a: "Product, Article, Event, breadcrumbs, and software apps can still qualify when the required fields are present. FAQ rich results have been limited to authoritative government and health sites since 2023. HowTo rich results were removed. The markup is still valid." },
    { q: "How do I add JSON-LD in Next.js App Router?", a: "Copy the Next.js snippet. It sets dangerouslySetInnerHTML to JSON.stringify(data) with < escaped as \\u003c, so a string in your content cannot close the script tag." },
    { q: "Can I combine types on one page?", a: "Yes. Turn on Combine into @graph, add each entity, and paste one script. A product page often wants Product plus BreadcrumbList." },
  ],
  seo: {
    title: "JSON-LD schema generator",
    description: "Build Article, FAQPage, HowTo, Product, Organization, and more schema.org JSON-LD, then copy the script or a Next.js component.",
  },
  howTo: [
    { name: "Choose a schema type", text: "Pick Article, FAQ, HowTo, Product, Organization, Person, LocalBusiness, breadcrumbs, software, WebSite, or Event." },
    { name: "Fill the fields and fix warnings", text: "Required fields are marked. The checklist flags missing recommended fields, broken URLs, and dates that are not ISO." },
    { name: "Paste the script into your page", text: "Copy the script tag, the raw JSON, or the Next.js component and place it in the page head or body." },
  ],
  inputs: "A schema type and the fields that type needs, including repeaters for FAQ, steps, and breadcrumbs.",
  outputs: "A script tag, raw JSON, a Next.js snippet, and a pass or warn checklist.",
  runsLocally: true,
} satisfies ToolMeta;
