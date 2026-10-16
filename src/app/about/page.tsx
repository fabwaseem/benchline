import type { Metadata } from "next";
import Link from "next/link";
import { categories } from "@/registry/categories";
import { tools } from "@/registry";
import { FaqAccordion } from "@/components/kit/faq-accordion";
import { JsonLd } from "@/lib/jsonld";
import { MAKER_URL, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `${SITE_NAME} is a directory of exact, local, current developer tools. Nothing you paste is stored.`,
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
    d: "The bench is static HTML plus a small client for the tool you opened. The 3D hero is a separate chunk.",
  },
  {
    t: "Current",
    d: "Model prices carry a checked date. Specs link to the canonical document, not a paraphrase that drifts.",
  },
];

export default function AboutPage() {
  const local = tools.filter((tool) => tool.runsLocally).length;
  return (
    <div className="page-x pb-24">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Person",
              name: "Waseem Anjum",
              url: MAKER_URL,
              sameAs: ["https://github.com/fabwaseem"],
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
      <header className="grid gap-10 py-16 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
        <div>
          <p className="eyebrow">
            <span className="font-mono">01</span> The bench
          </p>
          <h1 className="d1 mt-4">
            A directory,
            <br />
            kept exact.
          </h1>
        </div>
        <p className="lede self-end">
          {SITE_NAME} is a directory of exact tools at {SITE_URL.replace("https://", "")}.
          {` ${tools.length} tools, ${categories.length} categories, ${local} of them entirely in the browser.`}
        </p>
      </header>

      <section id="principles" className="grid border-y border-border sm:grid-cols-2 lg:grid-cols-4">
        {principles.map((item, i) => (
          <article key={item.t} className="border-border p-6 sm:[&:nth-child(odd)]:border-r lg:border-r lg:last:border-r-0">
            <p className="font-mono text-[11px] text-faint">0{i + 1}</p>
            <h2 className="mt-3 text-[22px] font-medium tracking-[-0.03em]">{item.t}</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{item.d}</p>
          </article>
        ))}
      </section>

      <section id="data" className="mt-16 grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <p className="eyebrow">Data</p>
          <h2 className="d3 mt-3">What leaves the tab.</h2>
        </div>
        <div className="overflow-x-auto rounded-[14px] border border-border">
          <table className="w-full min-w-[560px] text-left text-[14px]">
            <thead className="bg-sunken font-mono text-[10px] tracking-[0.12em] text-faint uppercase">
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
                    <Link href={`/t/${tool.slug}`} className="hover:text-brand">
                      {tool.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {tool.runsLocally ? "This browser" : "This browser, then one public fetch"}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">
                    {tool.runsLocally ? "Nothing" : "The URL you submit"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16 grid gap-8 lg:grid-cols-2">
        <div className="card p-7">
          <p className="eyebrow">Maker</p>
          <h2 className="mt-3 text-[28px] font-medium tracking-[-0.03em]">Waseem Anjum</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Built and maintained by one person. The source is public, the registry is generated, and
            the prices say when they were last checked.
          </p>
          <a href={MAKER_URL} className="btn btn-ink mt-5">
            fabwaseem.com
          </a>
        </div>
        <div>
          <p className="eyebrow">Notes</p>
          <FaqAccordion
            faqs={[
              {
                q: "What is Benchline?",
                a: "A directory of exact, local, current developer tools, plus an AI access layer. The tools are pure functions. The domain is tools.fabwaseem.com.",
              },
              {
                q: "How current are the model prices?",
                a: "Each price row carries the date it was checked. The home page prints that date on the model pill.",
              },
              {
                q: "Can an agent call a tool?",
                a: "Yes. /mcp speaks the Model Context Protocol, and /api/v1/tools/<slug> is the same function over HTTP. Instructions live on /ai.",
              },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
