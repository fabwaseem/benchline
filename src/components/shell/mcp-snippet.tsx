import { CopyButton } from "@/components/kit/copy-button";
import { exampleArguments, mcpServerConfig, toolsCallParams } from "@/lib/mcp/example";
import { SITE_URL } from "@/lib/site";
import type { z } from "zod";

export function McpSnippet({ name, inputSchema }: { name: string; inputSchema: z.ZodType }) {
  const endpoint = `${SITE_URL}/mcp`;
  const config = JSON.stringify(mcpServerConfig(endpoint), null, 2);
  const args = exampleArguments(inputSchema);
  const call = JSON.stringify(toolsCallParams(name, args), null, 2);
  return (
    <section id="agent" className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-mono text-[11px] tracking-[0.08em] text-faint uppercase">Call from your agent</h2>
        <CopyButton value={config} label="Copy config" />
      </div>
      <p className="mt-3 font-mono text-[11px] tracking-[0.06em] text-faint uppercase">Streamable HTTP</p>
      <pre className="mt-1.5 overflow-x-auto rounded-lg bg-sunken p-3 font-mono text-[12px] leading-5 text-foreground">{config}</pre>
      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="font-mono text-[11px] tracking-[0.06em] text-faint uppercase">tools/call</p>
        <CopyButton value={call} label="Copy call" />
      </div>
      <p className="mt-1.5 font-mono text-[12.5px] text-brand-text">{name}</p>
      <pre className="mt-1.5 overflow-x-auto rounded-lg bg-sunken p-3 font-mono text-[12px] leading-5 text-foreground">{call}</pre>
    </section>
  );
}
