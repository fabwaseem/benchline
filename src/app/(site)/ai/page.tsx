import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Braces, FileText, Plug } from "kineticons";
import { AgentNav } from "@/components/agents/agent-nav";
import { EndpointCard } from "@/components/agents/endpoint-card";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeading } from "@/components/site/section-heading";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { mcpIndex } from "@/registry/mcp-index";

export const metadata: Metadata = {
  title: "MCP tool reference",
  description: `Every ${SITE_NAME} tool an AI agent can call over MCP or the JSON API, with its name and what it reads.`,
  alternates: { canonical: "/ai" },
};

const endpoint = `${SITE_URL}/mcp`;

const ways = [
  {
    icon: Plug,
    title: "MCP server",
    text: "One Streamable HTTP endpoint for Claude, Cursor, VS Code, and any MCP client.",
    href: "/mcp/guide",
    cta: "Set it up",
  },
  {
    icon: Braces,
    title: "JSON API",
    text: "POST the tool's input to /api/v1/tools/<slug>. The OpenAPI document lists every path.",
    href: "/openapi.json",
    cta: "Open openapi.json",
  },
  {
    icon: FileText,
    title: "Docs for LLMs",
    text: "llms.txt indexes the site; llms-full.txt has every tool's description in one file.",
    href: "/llms-full.txt",
    cta: "Read llms-full.txt",
  },
];

export default function AiPage() {
  const web = mcpIndex.filter((tool) => tool.openWorld).length;
  return (
    <div className="pb-24">
      <PageHero
        eyebrow="Tool reference"
        title={<>{mcpIndex.length} tools your agent can <span className="mark-lime">call by name.</span></>}
        aside={<EndpointCard endpoint={endpoint} tools={mcpIndex.length} />}
      >
        Every tool on the site is also an MCP tool and a JSON endpoint. No key. Sixty calls a minute per address.
      </PageHero>
      <AgentNav active="reference" />

      <section aria-labelledby="ways-title" className="page-x frame mt-16">
        <SectionHeading id="ways-title" eyebrow="Access" title="Three ways in" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {ways.map(({ icon: Icon, title, text, href, cta }) => {
            const className =
              "ki-trigger lift group flex h-full flex-col rounded-2xl border border-border bg-surface p-6 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";
            const body = (
              <>
                <span className="grid size-10 place-items-center rounded-lg bg-brand-wash text-brand-text">
                  <Icon size={20} variant="duotone" aria-hidden />
                </span>
                <span className="mt-5 block text-[19px] font-semibold tracking-[-0.025em]">{title}</span>
                <span className="mt-2 block text-[14.5px] leading-6 text-muted-foreground">{text}</span>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[13.5px] font-medium text-brand-text">
                  {cta}
                  <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </>
            );
            return href.startsWith("/mcp") ? (
              <Link key={title} href={href} className={className}>
                {body}
              </Link>
            ) : (
              <a key={title} href={href} className={className}>
                {body}
              </a>
            );
          })}
        </div>
      </section>

      <section id="tools" aria-labelledby="reference-title" className="page-x frame mt-20 scroll-mt-32">
        <SectionHeading id="reference-title" eyebrow="Reference" title="Every MCP tool">
          {mcpIndex.length - web} tools only transform the arguments you send. {web} read the open web: they fetch the public URL you pass, with private
          addresses blocked. Open a tool to try it in the browser and copy a ready <span className="font-mono text-foreground">tools/call</span>.
        </SectionHeading>
        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {mcpIndex.map((tool) => (
            <li key={tool.name}>
              <Link
                href={`/t/${tool.slug}#agent`}
                className="ki-trigger group grid gap-2 px-5 py-4 transition-colors hover:bg-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset md:grid-cols-[240px_1fr_auto] md:items-center md:gap-6"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <code className="font-mono text-[13px] font-medium text-brand-text">{tool.name}</code>
                  {tool.openWorld ? <span className="chip h-5 text-[10.5px]">reads web</span> : null}
                </span>
                <span className="text-[14px] leading-6 text-muted-foreground">
                  <span className="font-semibold text-foreground">{tool.title}.</span> {tool.description}
                </span>
                <span className="hidden items-center gap-1 font-mono text-[11.5px] text-faint group-hover:text-brand-text md:inline-flex">
                  /t/{tool.slug}
                  <ArrowRight size={13} aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
