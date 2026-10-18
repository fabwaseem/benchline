import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "MCP",
  description: `Call every ${SITE_NAME} tool from Claude Desktop, Cursor, or VS Code.`,
  alternates: { canonical: "/mcp" },
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

export default function McpGuidePage() {
  return (
    <div className="page-x pb-24">
      <header className="max-w-[760px] py-16 lg:py-24">
        <p className="eyebrow">
          <span className="font-mono">MCP</span> Server
        </p>
        <h1 className="d2 mt-4">One endpoint for every tool.</h1>
        <p className="lede mt-5">
          {endpoint} is a stateless Streamable HTTP server. No key. Sixty calls a minute per address. The same functions are at{" "}
          <span className="font-mono text-[14px]">POST /api/v1/tools/&lt;slug&gt;</span>.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="card p-6">
          <p className="font-mono text-[11px] text-faint">01</p>
          <h2 className="mt-3 text-[22px] font-medium tracking-[-0.03em]">Claude Desktop</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
            Add the URL to claude_desktop_config.json. A build that only starts a local command can use mcp-remote with the same URL.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-[10px] bg-sunken p-3 font-mono text-[12px] leading-relaxed">{claudeDesktop}</pre>
          <pre className="mt-3 overflow-x-auto rounded-[10px] bg-sunken p-3 font-mono text-[12px] leading-relaxed">{claudeRemote}</pre>
        </article>
        <article className="card p-6">
          <p className="font-mono text-[11px] text-faint">02</p>
          <h2 className="mt-3 text-[22px] font-medium tracking-[-0.03em]">Cursor</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
            Add a remote MCP server in settings, or put this in ~/.cursor/mcp.json. The server answers JSON and does not keep a session.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-[10px] bg-sunken p-3 font-mono text-[12px] leading-relaxed">{cursor}</pre>
        </article>
        <article className="card p-6">
          <p className="font-mono text-[11px] text-faint">03</p>
          <h2 className="mt-3 text-[22px] font-medium tracking-[-0.03em]">VS Code</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
            Save this as .vscode/mcp.json in a workspace, or add it from the MCP: Add Server command.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-[10px] bg-sunken p-3 font-mono text-[12px] leading-relaxed">{vscode}</pre>
        </article>
      </section>

      <section className="mt-16 max-w-[760px]">
        <h2 className="h-panel">Files leave the browser</h2>
        <p className="mt-4 text-[15.5px] leading-7 text-muted-foreground">
          The tool pages still run on your device. An MCP call is different. A file you send as base64, or a public URL the server fetches, is read in memory to run the function and is not stored. Private and local addresses are refused. A file is capped at 10 MB. The tool list and names are on <Link href="/ai" className="underline">AI access</Link>.
        </p>
      </section>
    </div>
  );
}
