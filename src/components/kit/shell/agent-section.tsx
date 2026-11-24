"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Copy } from "kineticons";
import { Button } from "@/components/kit/primitives/button";
import { CopyButton } from "@/components/kit/copy-button";
import { Segmented } from "@/components/kit/segmented";
import { CodeViewer } from "@/components/kit/code-viewer";

const clients = ["Cursor", "Claude Desktop", "VS Code", "cURL"] as const;
type Client = (typeof clients)[number];

function configFor(client: Client, endpoint: string, call: string) {
  if (client === "cURL") {
    return `curl -s ${endpoint} \\\n  -H 'content-type: application/json' \\\n  -H 'accept: application/json, text/event-stream' \\\n  -d '${call.replaceAll("'", "'\\''")}'`;
  }
  if (client === "VS Code") {
    return JSON.stringify({ servers: { benchline: { type: "http", url: endpoint } } }, null, 2);
  }
  return JSON.stringify({ mcpServers: { benchline: { url: endpoint } } }, null, 2);
}

function configLabel(client: Client) {
  if (client === "Cursor") return "~/.cursor/mcp.json";
  if (client === "Claude Desktop") return "claude_desktop_config.json";
  if (client === "VS Code") return ".vscode/mcp.json";
  return "Terminal";
}

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10.5px] tracking-[0.1em] text-faint uppercase">{label}</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <code className="min-w-0 flex-1 truncate rounded-md bg-surface px-2.5 py-2 font-mono text-[12.5px] text-brand-text shadow-[inset_0_0_0_1px_var(--border)]" title={value}>
          {value}
        </code>
        <CopyButton value={value} label={`Copy ${label.toLowerCase()}`} toastMessage={`${label} copied`} iconOnly icon={<Copy size={15} aria-hidden />} />
      </div>
    </div>
  );
}

export function AgentSection({ name, endpoint, call }: { name: string; endpoint: string; call: string }) {
  const [client, setClient] = useState<Client>("Cursor");
  const config = configFor(client, endpoint, call);
  const curl = client === "cURL";
  return (
    <section id="agent" aria-labelledby="agent-title" className="scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-1)]">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-5 py-5 sm:px-6">
        <div>
          <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-brand-text uppercase">MCP</p>
          <h2 id="agent-title" className="mt-2 text-[22px] font-semibold tracking-[-0.03em]">
            Use this tool from your agent
          </h2>
          <p className="mt-1 text-[14px] text-muted-foreground">Add the server once, then ask for the job in plain words. No key.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/mcp/guide" />}>
            Setup guide
          </Button>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/ai#tools" />}>
            All MCP tools
            <ArrowUpRight size={14} aria-hidden />
          </Button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-5 border-b border-border bg-well p-5 sm:p-6 lg:border-r lg:border-b-0">
          <CopyField label="Tool name" value={name} />
          <CopyField label="Endpoint" value={endpoint} />
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="font-mono text-[10.5px] tracking-[0.1em] text-faint uppercase">Auth</dt>
              <dd className="mt-1 text-[13.5px] font-semibold">None</dd>
            </div>
            <div>
              <dt className="font-mono text-[10.5px] tracking-[0.1em] text-faint uppercase">Rate</dt>
              <dd className="mt-1 text-[13.5px] font-semibold">60 / min</dd>
            </div>
          </dl>
          <ol className="space-y-3 border-t border-border pt-5">
            {[
              "Add the server config for your client.",
              `Ask your agent to run ${name}, or describe the job.`,
              "Or send the tools/call request yourself.",
            ].map((step, index) => (
              <li key={step} className="grid grid-cols-[24px_1fr] gap-2.5 text-[13.5px] leading-5 text-muted-foreground">
                <span className="grid size-6 place-items-center rounded-md bg-brand-wash font-mono text-[11px] font-medium text-brand-text">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </aside>

        <div className="min-w-0 p-5 sm:p-6">
          <Segmented label="MCP client" value={client} onChange={setClient} options={clients.map((item) => ({ value: item, label: item }))} />
          <div className={curl ? "mt-4" : "mt-4 grid gap-4 xl:grid-cols-2"}>
            <CodeViewer code={config} label={configLabel(client)} language={curl ? "bash" : "json"} maxHeight={360} wrapDefault />
            {curl ? null : <CodeViewer code={call} label="tools/call request" language="json" maxHeight={360} wrapDefault />}
          </div>
        </div>
      </div>
    </section>
  );
}
