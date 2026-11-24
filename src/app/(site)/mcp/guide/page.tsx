import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ClaudeLogo, CursorLogo, Globe, Terminal } from "kineticons";
import { AgentNav } from "@/components/agents/agent-nav";
import { EndpointCard } from "@/components/agents/endpoint-card";
import { CodeViewer } from "@/components/kit/code-viewer";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeading } from "@/components/site/section-heading";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { mcpIndex } from "@/registry/mcp-index";

export const metadata: Metadata = {
  title: "MCP setup",
  description: `Connect Claude, Cursor, VS Code, or ChatGPT to every ${SITE_NAME} tool with one MCP URL. No key.`,
  alternates: { canonical: "/mcp/guide" },
  openGraph: { url: "/mcp/guide", title: "MCP setup", description: `Connect Claude, Cursor, VS Code, or ChatGPT to every ${SITE_NAME} tool with one MCP URL. No key.` },
};

const endpoint = `${SITE_URL}/mcp`;

const claudeDesktop = `{
  "mcpServers": {
    "benchline": {
      "url": "${endpoint}"
    }
  }
}`;

const claudeRemote = `{
  "mcpServers": {
    "benchline": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "${endpoint}"]
    }
  }
}`;

const cursor = `{
  "mcpServers": {
    "benchline": {
      "url": "${endpoint}"
    }
  }
}`;

const vscode = `{
  "servers": {
    "benchline": {
      "type": "http",
      "url": "${endpoint}"
    }
  }
}`;

const listCall = `curl -s ${endpoint} \\
  -H 'content-type: application/json' \\
  -H 'accept: application/json, text/event-stream' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;

const toolCall = `curl -s ${endpoint} \\
  -H 'content-type: application/json' \\
  -H 'accept: application/json, text/event-stream' \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call",
       "params":{"name":"format_json","arguments":{"json":"{\\"a\\":1}","indent":"2"}}}'`;

function ClientCard({
  step,
  name,
  icon,
  children,
  code,
}: {
  step: string;
  name: string;
  icon: ReactNode;
  children: ReactNode;
  code: ReactNode;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-1)]">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-well shadow-[inset_0_0_0_1px_var(--border)]">{icon}</span>
        <div>
          <p className="font-mono text-[11px] text-brand-text">{step}</p>
          <h3 className="text-[19px] font-semibold tracking-[-0.025em]">{name}</h3>
        </div>
      </div>
      <div className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">{children}</div>
      <div className="mt-5 grid gap-3">{code}</div>
    </article>
  );
}

export default function McpGuidePage() {
  return (
    <div className="pb-24">
      <PageHero
        eyebrow="MCP setup"
        title={<>Connect your agent to <span className="mark-lime">every tool.</span></>}
        aside={<EndpointCard endpoint={endpoint} tools={mcpIndex.length} />}
      >
        Paste one URL into your MCP client. The server is stateless and needs no key. The tool pages still run on your device; an MCP call runs the same function on the server.
      </PageHero>
      <AgentNav active="setup" />

      <section aria-labelledby="clients-title" className="page-x frame mt-16">
        <SectionHeading id="clients-title" eyebrow="Step 1" title="Add the server to your client">
          Pick the app you use. Each one reads the same endpoint.
        </SectionHeading>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <ClientCard
            step="Claude Desktop"
            name="Edit the config file"
            icon={<ClaudeLogo size={20} aria-hidden />}
            code={
              <>
                <CodeViewer code={claudeDesktop} label="claude_desktop_config.json" language="json" filename="claude_desktop_config.json" wrapDefault />
                <CodeViewer code={claudeRemote} label="Older builds: mcp-remote" language="json" wrapDefault />
              </>
            }
          >
            Add the URL to claude_desktop_config.json and restart Claude. A build that only starts a local command can wrap the same URL with mcp-remote.
          </ClientCard>
          <ClientCard
            step="Claude.ai"
            name="Add a custom connector"
            icon={<ClaudeLogo size={20} aria-hidden />}
            code={<CodeViewer code={endpoint} label="Connector URL" language="plaintext" wrapDefault />}
          >
            In Settings, open Connectors, choose Add custom connector, and paste the URL. Claude lists the tools from the server. Tools that read the open web are marked as such.
          </ClientCard>
          <ClientCard
            step="Cursor"
            name="Add a remote server"
            icon={<CursorLogo size={20} aria-hidden />}
            code={<CodeViewer code={cursor} label="~/.cursor/mcp.json" language="json" filename="mcp.json" wrapDefault />}
          >
            Add a remote MCP server in settings, or save this as ~/.cursor/mcp.json. The server answers JSON and does not keep a session.
          </ClientCard>
          <ClientCard
            step="VS Code"
            name="Add a workspace server"
            icon={<Terminal size={20} aria-hidden />}
            code={<CodeViewer code={vscode} label=".vscode/mcp.json" language="json" filename="mcp.json" wrapDefault />}
          >
            Save this as .vscode/mcp.json in a workspace, or run MCP: Add Server from the command palette and paste the URL.
          </ClientCard>
        </div>
        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-border bg-well p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface shadow-[inset_0_0_0_1px_var(--border)]">
              <Globe size={20} aria-hidden />
            </span>
            <div>
              <h3 className="text-[16px] font-semibold tracking-[-0.02em]">ChatGPT and other HTTP clients</h3>
              <p className="mt-1 max-w-[60ch] text-[14px] leading-6 text-muted-foreground">
                Create an action from the OpenAPI document. Each path is one tool, and the operation id is its MCP name.
              </p>
            </div>
          </div>
          <a href="/openapi.json" className="btn shrink-0">
            Open openapi.json
          </a>
        </div>
      </section>

      <section aria-labelledby="try-title" className="page-x frame mt-20">
        <SectionHeading id="try-title" eyebrow="Step 2" title="Check it from a terminal">
          No client yet? These two calls list the tools and run one. The same functions answer at{" "}
          <span className="font-mono text-foreground">POST /api/v1/tools/&lt;slug&gt;</span> with the tool&apos;s input as the JSON body.
        </SectionHeading>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <CodeViewer code={listCall} label="List the tools" language="bash" wrapDefault />
          <CodeViewer code={toolCall} label="Call format_json" language="bash" wrapDefault />
        </div>
      </section>

      <section aria-labelledby="privacy-title" className="page-x frame mt-20 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading id="privacy-title" eyebrow="Privacy" title="What leaves the browser" />
        <div className="space-y-4 text-[15.5px] leading-7 text-muted-foreground">
          <p>
            The tool pages run on your device. An MCP call is different: the server runs the function. A file you send as base64, or a public URL the
            server fetches, is read in memory and not stored.
          </p>
          <p>
            Private and local addresses are refused, and a file is capped at 10 MB. The per-tool list is on the{" "}
            <Link href="/about#data" className="font-medium text-brand-text underline underline-offset-4">
              data page
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="page-x frame mt-20">
        <Link
          href="/ai"
          className="ki-trigger lift group flex flex-col gap-4 rounded-2xl border border-border bg-brand-wash p-7 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            <span className="font-mono text-[11px] tracking-[0.1em] text-brand-text uppercase">Next</span>
            <span className="mt-2 block text-[24px] font-semibold tracking-[-0.03em]">Browse all {mcpIndex.length} MCP tools</span>
            <span className="mt-1 block text-[14.5px] text-muted-foreground">Every tool name, what it does, and whether it reads the web.</span>
          </span>
          <span className="inline-flex h-control-lg shrink-0 items-center gap-2 rounded-md bg-brand px-5 text-[14.5px] font-semibold text-brand-foreground">
            Tool reference
            <ArrowRight size={16} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </section>
    </div>
  );
}
