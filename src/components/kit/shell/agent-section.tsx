"use client";

import { useState } from "react";
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
  if (client === "Cursor") return "mcp.json";
  if (client === "Claude Desktop") return "claude_desktop_config.json";
  if (client === "VS Code") return ".vscode/mcp.json";
  return "curl";
}

export function AgentSection({ name, endpoint, call }: { name: string; endpoint: string; call: string }) {
  const [client, setClient] = useState<Client>("Cursor");
  const config = configFor(client, endpoint, call);
  return (
    <section id="agent" className="scroll-mt-24">
      <h2 className="text-[15px] font-medium">Use from your agent</h2>
      <p className="mt-1 max-w-[68ch] text-[13px] leading-5 text-muted-foreground">
        Streamable HTTP at {endpoint}. No key. The tool name is <span className="font-mono text-foreground">{name}</span>.
      </p>
      <div className="mt-4">
        <Segmented label="MCP client" value={client} onChange={setClient} options={clients.map((item) => ({ value: item, label: item }))} />
      </div>
      <div className="mt-3 grid gap-3 min-[900px]:grid-cols-2">
        <Snippet label={configLabel(client)} value={config} />
        <Snippet label="tools/call" value={call} />
      </div>
    </section>
  );
}

function Snippet({ label, value }: { label: string; value: string }) {
  const language = label === "curl" ? "bash" : "json";
  return <CodeViewer code={value} label={label} language={language} maxHeight={320} wrapDefault />;
}
