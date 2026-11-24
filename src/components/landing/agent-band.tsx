import Link from "next/link";
import { ArrowRight, ClaudeLogo, CursorLogo } from "kineticons";

const steps = [
  { n: "01", t: "Add one URL", d: "Paste the endpoint into Claude Desktop, Cursor or VS Code. No key, no account." },
  { n: "02", t: "Ask in plain words", d: "“Merge these PDFs”, “check this site’s robots.txt”. The agent picks the tool." },
  { n: "03", t: "Get the exact result", d: "The same pure function the web page runs, with typed input and output." },
];

export function AgentBand({ endpoint, total }: { endpoint: string; total: number }) {
  return (
    <section aria-labelledby="agents-title" className="relative isolate overflow-hidden border-y border-border bg-well">
      <div aria-hidden className="ground-grid absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,transparent,#000_30%,#000_70%,transparent)]" />
      <div className="page-x frame grid gap-14 py-20 md:py-28 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <div>
          <p className="eyebrow">For AI agents</p>
          <h2 id="agents-title" className="d2 mt-4 max-w-[16ch]">
            Every tool is also an <span className="mark-lime">MCP tool.</span>
          </h2>
          <p className="mt-6 max-w-[50ch] text-[16.5px] leading-[1.65] text-muted-foreground">
            One streamable HTTP endpoint exposes all {total} tools to any MCP client. Your agent gets schemas it can trust instead of guessing at a web page.
          </p>
          <ul aria-label="Works with" className="mt-7 flex flex-wrap items-center gap-2">
            <li className="chip h-8 gap-2 px-3 text-[12.5px]">
              <ClaudeLogo size={15} aria-hidden />
              Claude
            </li>
            <li className="chip h-8 gap-2 px-3 text-[12.5px]">
              <CursorLogo size={15} aria-hidden />
              Cursor
            </li>
            <li className="chip h-8 px-3 text-[12.5px]">VS Code</li>
            <li className="chip h-8 px-3 text-[12.5px]">Any MCP client</li>
          </ul>
          <ol className="mt-10 grid gap-6">
            {steps.map((step) => (
              <li key={step.n} className="grid grid-cols-[44px_1fr] gap-3">
                <span className="font-mono text-[12px] text-brand-text">{step.n}</span>
                <span>
                  <span className="block text-[15.5px] font-semibold tracking-[-0.015em]">{step.t}</span>
                  <span className="mt-1 block text-[14px] leading-6 text-muted-foreground">{step.d}</span>
                </span>
              </li>
            ))}
          </ol>
          <Link
            href="/mcp/guide"
            className="ki-trigger arrow-nudge mt-10 inline-flex h-control-lg items-center gap-2 rounded-md bg-brand px-5 text-[14.5px] font-semibold text-brand-foreground transition-[transform,background-color] duration-150 hover:bg-[color-mix(in_srgb,var(--accent-brand)_88%,var(--foreground))] active:translate-y-px focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            Set up MCP
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>

        <div className="app-frame min-w-0" role="img" aria-label="An MCP config for Benchline and an agent calling merge_pdf">
          <div aria-hidden>
            <div className="app-frame-bar">
              <i />
              <i />
              <i />
              <span className="ml-3 font-mono text-[12px] text-faint">claude_desktop_config.json</span>
            </div>
            <pre className="px-5 py-4 font-mono text-[12px] leading-[1.75] whitespace-pre-wrap break-all sm:text-[13px]">
              <span className="text-faint">{"{"}</span>
              {"\n  "}
              <span className="text-seg-payload">&quot;mcpServers&quot;</span>
              {": { "}
              <span className="text-seg-payload">&quot;benchline&quot;</span>
              {": {\n    "}
              <span className="text-seg-payload">&quot;url&quot;</span>
              {": "}
              <span className="text-brand-text">&quot;{endpoint}&quot;</span>
              {"\n  } }\n"}
              <span className="text-faint">{"}"}</span>
            </pre>
            <div className="border-t border-border bg-well p-5">
              <div className="ml-auto w-fit max-w-[85%] rounded-lg rounded-br-sm bg-raised px-3.5 py-2.5 text-[13.5px] shadow-[inset_0_0_0_1px_var(--border)]">
                Merge invoice-oct.pdf and invoice-nov.pdf into one file.
              </div>
              <div className="mt-3 flex items-center gap-3">
                <svg width="28" height="14" viewBox="0 0 28 14" className="shrink-0 text-brand-text">
                  <path d="M0 7h26" stroke="currentColor" strokeWidth="1.5" className="pulse-line" fill="none" />
                </svg>
                <span className="chip">
                  <span className="dot" />
                  tools/call · merge_pdf
                </span>
              </div>
              <div className="mt-3 w-fit max-w-[85%] rounded-lg rounded-bl-sm bg-surface px-3.5 py-2.5 text-[13.5px] shadow-[inset_0_0_0_1px_var(--border)]">
                Done. <span className="font-mono text-brand-text">merged.pdf</span>, 14 pages, 1.2 MB.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
