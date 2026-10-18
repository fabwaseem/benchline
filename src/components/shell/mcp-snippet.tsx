import { CopyButton } from "@/components/kit/copy-button";
import { SITE_URL } from "@/lib/site";

export function McpSnippet({ name }: { name: string }) {
  const code = `agent.mcp('${name}', input);`;
  return (
    <section id="agent" className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-mono text-[11px] tracking-[0.08em] text-faint uppercase">Call from your agent</h2>
        <CopyButton value={code} label="Copy snippet" />
      </div>
      <pre className="mt-3 overflow-x-auto font-mono text-[12.5px] leading-6">
        <span className="text-status-ok">agent</span>
        <span>.mcp(&apos;</span>
        <span className="text-brand-text">{name}</span>
        <span>&apos;, input);</span>
      </pre>
      <p className="mt-3 text-[12px] leading-5 text-muted-foreground">
        Tool name on <span className="font-mono">{SITE_URL}/mcp</span>
      </p>
    </section>
  );
}
