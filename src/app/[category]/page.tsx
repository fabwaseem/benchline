import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { CategoryBrowser } from "@/components/site/category-browser";
import { Cover } from "@/components/site/cover";
import { Flagship } from "@/components/site/flagship";
import { FaqAccordion } from "@/components/kit/faq-accordion";
import { JsonLd, collectionGraph } from "@/lib/jsonld";
import { absoluteUrl } from "@/lib/site";
import { categories, getCategory, toolsInCategory } from "@/registry";

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/${category.slug}` },
    openGraph: { url: absoluteUrl(`/${category.slug}`), title: category.name, description: category.description },
  };
}

const guides: Record<string, { title: string; body: string }> = {
  "ai-search": {
    title: "What an AI crawler can actually fetch",
    body: "Start with llms.txt so a crawler has an index, then read robots.txt for the user-agents you care about, then score the page itself. Each checker names the URL it requests. Generators that only format text stay in the browser.",
  },
  social: {
    title: "The card a share becomes",
    body: "An unfurl is a title, a description, and a 1200×630 image. Build the card in the browser, then inspect a public URL if you need to see what is already published. The inspector fetches only that URL.",
  },
  auth: {
    title: "Read the token before you trust it",
    body: "A JWT is three segments. Decode them locally, then verify only if you already have the secret or public key. This bench does not call a JWKS URL.",
  },
  seo: {
    title: "Markup a crawler can quote",
    body: "JSON-LD is easier to get wrong than to write. Pick a type, fill the fields the type requires, and copy the script. Nothing is uploaded.",
  },
  ai: {
    title: "Count before you send",
    body: "Tokenisers disagree. The counter uses o200k or cl100k where that matches the model, and says when a price is an estimate. The prompt does not leave the tab.",
  },
  developer: {
    title: "A schedule you can read back",
    body: "Cron is five fields until it is not. The builder explains the expression, lists the next runs in the zone you pick, and shows the snippet a host actually expects.",
  },
  nextjs: {
    title: "A container that matches the app",
    body: "The Dockerfile follows the package manager, Node version, and standalone output you select. Download the set and read it. The generator does not build the image.",
  },
};

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const list = toolsInCategory(slug);
  const flagship = list[0];
  const local = list.filter((tool) => tool.runsLocally).length;
  const updated = list.map((tool) => tool.updatedAt).sort().at(-1) ?? "";
  const related = categories.filter((item) => item.slug !== slug).slice(0, 4);
  const guide = guides[slug];
  return (
    <>
      <JsonLd
        data={collectionGraph({
          url: absoluteUrl(`/${category.slug}`),
          name: category.name,
          description: category.description,
          items: list.map((tool) => ({ name: tool.name, url: absoluteUrl(`/t/${tool.slug}`) })),
        })}
      />
      <header className="gridbg grid items-end gap-10 border-b border-border px-4 py-10 min-[900px]:grid-cols-[1fr_520px] min-[900px]:px-12 min-[900px]:py-16">
        <div>
          <nav className="flex items-center gap-2 font-mono text-[12px] text-faint" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <b className="font-medium text-foreground">{category.name}</b>
          </nav>
          <h1 className="d1 mt-8 text-[64px] min-[700px]:text-[128px]">{category.name}</h1>
          <p className="lede mt-5 max-w-[52ch]">{category.description}</p>
          <div className="mt-8 flex gap-7 border-t border-border pt-5 text-[13px] text-muted-foreground">
            <span><b className="mb-0.5 block font-mono text-[20px] font-medium tracking-[-0.04em] text-foreground">{String(list.length).padStart(2, "0")}</b>Tools</span>
            <span><b className="mb-0.5 block font-mono text-[20px] font-medium tracking-[-0.04em] text-foreground">{local}</b>In browser</span>
            <span><b className="mb-0.5 block font-mono text-[20px] font-medium tracking-[-0.04em] text-foreground">{updated}</b>Updated</span>
          </div>
        </div>
        {flagship ? (
          <Suspense fallback={<div className="win h-48 bg-well" />}>
            <Flagship category={slug} href={`/t/${flagship.slug}`} name={flagship.name} />
          </Suspense>
        ) : null}
      </header>
      <CategoryBrowser
        hue={category.hue}
        updated={Object.fromEntries(list.map((tool) => [tool.slug, tool.updatedAt]))}
        tools={list.map((tool) => ({
          slug: tool.slug,
          name: tool.name,
          tagline: tool.tagline,
          description: tool.description,
          category: tool.category,
          tags: [...tool.tags],
          keywords: [...tool.keywords],
          status: tool.status,
          icon: tool.icon,
          runsLocally: tool.runsLocally,
          updatedAt: tool.updatedAt,
        }))}
      />
      {flagship ? (
        <section className="card mx-4 grid overflow-hidden min-[900px]:mx-12 min-[900px]:grid-cols-2">
          <div className="flex flex-col p-6 min-[700px]:p-10">
            <Cover hue={category.hue} icon={flagship.icon} size={56} />
            <h2 className="h-panel mt-7">{flagship.name}</h2>
            <p className="mt-3 max-w-[42ch] text-[15px] text-muted-foreground">{flagship.description}</p>
            <ul className="mt-6 flex flex-col gap-2 text-sm">
              {flagship.howTo.map((step) => (
                <li key={step.name} className="flex gap-2">
                  <Check size={16} strokeWidth={1.75} className="mt-0.5 text-success" />
                  <span>{step.name}</span>
                </li>
              ))}
            </ul>
            <Link href={`/t/${flagship.slug}`} className="btn-ink btn btn-lg mt-8 self-start">Open {flagship.name}</Link>
          </div>
          <div className="well m-4 p-5 font-mono text-[12.5px] leading-relaxed min-[900px]:m-6">
            <div className="text-faint">In</div>
            <p className="mt-1 text-foreground">{flagship.inputs}</p>
            <div className="mt-4 text-faint">Out</div>
            <p className="mt-1 text-foreground">{flagship.outputs}</p>
          </div>
        </section>
      ) : null}
      <section className="page-x pt-16 min-[700px]:pt-24">
        <div className="eyebrow">Related</div>
        <div className="mt-6 grid grid-cols-2 gap-3 min-[900px]:grid-cols-4 min-[900px]:gap-4">
          {related.map((item) => {
            const siblings = toolsInCategory(item.slug);
            return (
              <Link key={item.slug} href={`/${item.slug}`} className="card p-5">
                <div className="flex -space-x-2">
                  {siblings.slice(0, 3).map((tool) => (
                    <Cover key={tool.slug} hue={item.hue} icon={tool.icon} size={36} />
                  ))}
                </div>
                <div className="mt-4 font-semibold tracking-[-0.02em]">{item.name}</div>
                <div className="mt-1 font-mono text-[12px] text-faint">{String(siblings.length).padStart(2, "0")} tools</div>
              </Link>
            );
          })}
        </div>
      </section>
      {guide ? (
        <section className="page-x grid gap-10 pt-16 pb-20 min-[900px]:grid-cols-2 min-[900px]:gap-16 min-[900px]:pt-24">
          <div>
            <h2 className="h-panel">{guide.title}</h2>
            <p className="mt-3.5 max-w-[60ch] text-[15.5px] leading-7 text-muted-foreground">{guide.body}</p>
          </div>
          <div>
            <h2 className="h-panel">Questions</h2>
            <div className="mt-2">
              <FaqAccordion faqs={flagship ? [...flagship.faqs] : []} />
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
