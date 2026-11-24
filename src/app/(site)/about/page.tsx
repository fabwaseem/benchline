import type { Metadata } from "next";
import Link from "next/link";
import { categories } from "@/registry/categories";
import { tools } from "@/registry";
import { FaqAccordion } from "@/components/kit/faq-accordion";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeading } from "@/components/site/section-heading";
import { ArrowUpRight } from "kineticons";
import { FOUNDER } from "@/lib/founder";
import { FOUNDER_ID, JsonLd } from "@/lib/jsonld";
import { GITHUB_URL, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `${SITE_NAME} is a directory of exact, local, free browser tools, built by Waseem Anjum. Nothing you paste is stored.`,
  alternates: { canonical: "/about" },
};

const principles = [
  {
    t: "Exact",
    d: "Every number on the page is computed from the input in front of you. Sample fixtures are labeled as samples.",
  },
  {
    t: "Private",
    d: "Local tools run in the tab. A fetch happens only when the tool’s job is to read a public URL, and only that URL.",
  },
  {
    t: "Fast",
    d: "The directory is static HTML. Each tool loads as its own chunk when you open it.",
  },
  {
    t: "Current",
    d: "Model prices carry a checked date. Specs link to the canonical document, not a paraphrase that drifts.",
  },
];

export default function AboutPage() {
  const local = tools.filter((tool) => tool.runsLocally).length;
  return (
    <div className="pb-24">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "AboutPage",
              "@id": `${SITE_URL}/about#page`,
              url: `${SITE_URL}/about`,
              name: `About ${SITE_NAME}`,
              about: { "@id": `${SITE_URL}#organization` },
              author: { "@id": FOUNDER_ID },
              mainEntity: { "@id": FOUNDER_ID },
              publisher: { "@id": `${SITE_URL}#organization` },
              isPartOf: { "@id": `${SITE_URL}#website` },
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "Does Benchline store what I paste?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "No. Local tools never send the input to a server. Network tools fetch only the public URL you asked them to read.",
                  },
                },
              ],
            },
          ],
        }}
      />
      <PageHero
        eyebrow="About"
        title={<>A directory of web tools, <span className="mark-lime">kept exact.</span></>}
        aside={
          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-border shadow-[0_0_0_1px_var(--border)]">
            {[
              { v: tools.length, k: "tools" },
              { v: categories.length, k: "categories" },
              { v: local, k: "in browser" },
            ].map((item) => (
              <div key={item.k} className="flex flex-col-reverse bg-surface p-5">
                <dt className="mt-1 text-[13px] text-muted-foreground">{item.k}</dt>
                <dd className="text-[34px] font-semibold tracking-[-0.04em] tabular-nums">{item.v}</dd>
              </div>
            ))}
          </dl>
        }
      >
        {SITE_NAME} lives at {SITE_URL.replace("https://", "")}. Each tool is a pure function you can open in a tab or call from an agent, and every number it shows comes from your input.
      </PageHero>

      <section id="founder" aria-labelledby="founder-title" className="page-x frame mt-16 scroll-mt-24">
        <div className="grid gap-8 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-1)] sm:p-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <span aria-hidden className="grid size-20 place-items-center rounded-2xl bg-brand text-[28px] font-semibold tracking-[-0.04em] text-brand-foreground">
            WA
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-brand-text uppercase">Founder</p>
            <h2 id="founder-title" className="mt-2 text-[26px] font-semibold tracking-[-0.03em]">
              <a href={FOUNDER.url} rel="author" className="u-draw focus-visible:outline-none">{FOUNDER.name}</a>
            </h2>
            <p className="mt-1 text-[14.5px] font-medium text-fg2">{FOUNDER.jobTitle}</p>
            <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed text-muted-foreground">
              {FOUNDER.name} built {SITE_NAME} and keeps it running. {FOUNDER.bio}
            </p>
          </div>
          <ul className="flex flex-wrap gap-2 lg:max-w-[260px] lg:justify-end">
            {FOUNDER.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  rel={link.label === "Website" ? "author me" : "me noopener"}
                  className="ki-trigger inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-fg2 transition-colors hover:border-border-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {link.label}
                  <ArrowUpRight size={13} aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="principles" aria-label="Principles" className="page-x frame mt-16 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {principles.map((item, i) => (
          <article key={item.t} className="border-t-2 border-border pt-6 first:border-brand-text">
            <p className="font-mono text-[11px] text-brand-text">0{i + 1}</p>
            <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.03em]">{item.t}</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{item.d}</p>
          </article>
        ))}
      </section>

      <section id="data" className="page-x frame mt-24 grid scroll-mt-24 gap-8 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <p className="eyebrow">Data</p>
          <h2 className="d3 mt-4">What leaves the tab.</h2>
          <p className="mt-4 max-w-[40ch] text-[15px] leading-6 text-muted-foreground">Every tool, where it runs, and what it sends. Local tools send nothing at all.</p>
        </div>
        <div className="max-h-[640px] overflow-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[560px] text-left text-[14px]">
            <thead className="sticky top-0 bg-sunken font-mono text-[10.5px] tracking-[0.12em] text-faint uppercase">
              <tr>
                <th className="px-4 py-3 font-normal">Tool</th>
                <th className="px-4 py-3 font-normal">Where it runs</th>
                <th className="px-4 py-3 font-normal">Sent</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tool) => (
                <tr key={tool.slug} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link href={`/t/${tool.slug}`} className="u-draw font-medium hover:text-brand-text">
                      {tool.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {tool.runsLocally ? "This browser" : "This browser, then one public fetch"}
                  </td>
                  <td className={tool.runsLocally ? "px-4 py-3 font-mono text-[12px] text-brand-text" : "px-4 py-3 font-mono text-[12px] text-muted-foreground"}>
                    {tool.runsLocally ? "Nothing" : "The URL you submit"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="page-x frame mt-24 grid gap-8 lg:grid-cols-2">
        <div className="relative isolate overflow-hidden rounded-2xl border border-border bg-brand-wash p-8">
          <div aria-hidden className="ground-glow absolute inset-0 -z-10" />
          <p className="eyebrow">Open source</p>
          <h2 className="mt-4 text-[30px] font-semibold tracking-[-0.035em]">The whole bench is public.</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            An independent tool bench. The source is public, the registry is generated, and the
            prices say when they were last checked.
          </p>
          <a href={GITHUB_URL} className="btn btn-brand mt-6">
            Read the source on GitHub
          </a>
        </div>
        <div>
          <SectionHeading eyebrow="Notes" title="Common questions" className="mb-4" />
          <FaqAccordion
            faqs={[
              {
                q: "Who made Benchline?",
                a: `${FOUNDER.name}, a ${FOUNDER.jobTitle.toLowerCase()}. More of his work is at ${FOUNDER.url.replace("https://", "")}.`,
              },
              {
                q: "What is Benchline?",
                a: "A directory of exact, local, current developer tools, plus an AI access layer. The tools are pure functions.",
              },
              {
                q: "How current are the model prices?",
                a: "Each price row in the token counter carries the date it was checked.",
              },
              {
                q: "Can an agent call a tool?",
                a: "Yes. /mcp speaks the Model Context Protocol, and /api/v1/tools/<slug> is the same function over HTTP. Setup for Claude Desktop, Cursor, and VS Code is on /mcp.",
              },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
