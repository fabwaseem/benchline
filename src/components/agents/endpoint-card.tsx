import { CopyButton } from "@/components/kit/copy-button";

const facts = [
  { k: "Transport", v: "Streamable HTTP" },
  { k: "Auth", v: "None" },
  { k: "Rate", v: "60 calls / min" },
  { k: "Files", v: "10 MB cap" },
];

/** The one URL an agent needs, with copy, and the four facts people ask about first. */
export function EndpointCard({ endpoint, tools }: { endpoint: string; tools: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-2)]">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <p className="flex items-center gap-2 text-[13px] font-semibold">
          <span className="dot" aria-hidden />
          MCP endpoint
        </p>
        <span className="font-mono text-[12px] text-faint">{tools} tools</span>
      </div>
      <div className="flex items-center gap-2 px-5 py-4">
        <code className="min-w-0 flex-1 truncate rounded-md bg-well px-3 py-2.5 font-mono text-[13.5px] text-brand-text shadow-[inset_0_0_0_1px_var(--border)]">{endpoint}</code>
        <CopyButton value={endpoint} label="Copy URL" toastMessage="Endpoint copied" size="default" />
      </div>
      <dl className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.k} className="bg-surface px-5 py-3">
            <dt className="font-mono text-[10.5px] tracking-[0.1em] text-faint uppercase">{fact.k}</dt>
            <dd className="mt-1 text-[13.5px] font-semibold">{fact.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
