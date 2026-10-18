import type { Metadata } from "next";
import Link from "next/link";
import { CodeViewer } from "@/components/kit/code-viewer";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { mcpIndex } from "@/registry/mcp-index";

export const metadata: Metadata = {
  title: "AI access",
  description: `Call every ${SITE_NAME} tool from Cursor, Claude, or ChatGPT.`,
  alternates: { canonical: "/ai" },
};

const endpoint = `${SITE_URL}/mcp`;

const cursorConfig = `{
  "mcpServers": {
    "benchline": {
      "url": "${endpoint}"
    }
  }
}`;

export default function AiPage() {
  return (
    <div className="page-x pb-24">
      <header className="max-w-[760px] py-16 lg:py-24">
        <p className="eyebrow">
          <span className="font-mono">AI</span> Access
        </p>
        <h1 className="mt-4 text-[40px] font-semibold tracking-[-0.045em]">The same functions, for an agent.</h1>
        <p className="lede mt-5">
          {mcpIndex.length} tools are registered on a stateless MCP endpoint and on a JSON API. No key. Sixty calls a minute per address.{" "}
          <Link href="/mcp/guide" className="underline">Setup for Claude Desktop, Cursor, and VS Code</Link>.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="card p-6">
          <p className="font-mono text-[11px] text-faint">01</p>
          <h2 className="mt-3 text-[22px] font-medium tracking-[-0.03em]">Cursor</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
            Add a remote MCP server. Cursor sends JSON-RPC to the URL below. The server answers with JSON and does not keep a session.
          </p>
          <CodeViewer className="mt-4" code={cursorConfig} label="Cursor MCP" language="json" filename="mcp.json" maxHeight={220} />
        </article>
        <article className="card p-6">
          <p className="font-mono text-[11px] text-faint">02</p>
          <h2 className="mt-3 text-[22px] font-medium tracking-[-0.03em]">Claude</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
            In Claude, add a custom connector and paste the MCP URL. Claude lists the tools from the server. Network tools are marked as reaching the open web.
          </p>
          <p className="mt-4 font-mono text-[12.5px] break-all">{endpoint}</p>
        </article>
        <article className="card p-6">
          <p className="font-mono text-[11px] text-faint">03</p>
          <h2 className="mt-3 text-[22px] font-medium tracking-[-0.03em]">ChatGPT</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
            Create an action from the OpenAPI document. Each path is one tool. The operation id is the snake_case MCP name.
          </p>
          <p className="mt-4 font-mono text-[12.5px] break-all">{SITE_URL}/openapi.json</p>
        </article>
      </section>

      <section className="mt-16 max-w-[760px]">
        <h2 className="h-panel">What an agent may fetch</h2>
        <p className="mt-4 text-[15.5px] leading-7 text-muted-foreground">
          The pages on this site still run local tools in the browser. An agent call is different: the server runs the function. Tools that read a public URL fetch that URL from the server, with the same private-address block as the checker pages. Tools that only transform the arguments you send do not fetch anything.
        </p>
        <ul className="mt-8 divide-y divide-border border-y border-border">
          {mcpIndex.map((tool) => (
            <li key={tool.name} className="grid gap-1 py-4 sm:grid-cols-[220px_1fr] sm:gap-6">
              <code className="font-mono text-[13px]">{tool.name}</code>
              <span className="text-[14.5px] text-muted-foreground">
                {tool.description}{" "}
                <span className="font-mono text-[12px] text-faint">POST /api/v1/tools/{tool.slug}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
