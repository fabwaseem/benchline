import Link from "next/link";
import { ArrowRight, FileUp, Laptop, Server, Sparkles } from "kineticons";

export function PrivacyBand({ local, network }: { local: number; network: number }) {
  return (
    <section aria-labelledby="privacy-title" className="page-x frame py-20 md:py-28">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <div>
          <p className="eyebrow">Privacy</p>
          <h2 id="privacy-title" className="d2 mt-4 max-w-[15ch]">
            Your file never leaves the tab.
          </h2>
          <p className="mt-6 max-w-[52ch] text-[16.5px] leading-[1.65] text-muted-foreground">
            {local} tools do their work in your browser with WebAssembly and plain JavaScript. The other {network} read a public URL because that is their job, and they read only the URL you typed.
          </p>
          <dl className="mt-10 grid gap-px overflow-hidden rounded-xl bg-border shadow-[0_0_0_1px_var(--border)] sm:grid-cols-3">
            {[
              { k: "Stored", v: "Nothing you paste" },
              { k: "Account", v: "Never asked for" },
              { k: "Source", v: "Public, MIT" },
            ].map((item) => (
              <div key={item.k} className="bg-surface p-4">
                <dt className="font-mono text-[11px] tracking-[0.1em] text-faint uppercase">{item.k}</dt>
                <dd className="mt-2 text-[15px] font-semibold tracking-[-0.015em]">{item.v}</dd>
              </div>
            ))}
          </dl>
          <Link href="/about#data" className="ki-trigger arrow-nudge mt-8 inline-flex items-center gap-1.5 text-[14.5px] font-medium text-brand-text focus-visible:underline focus-visible:outline-none">
            See what each tool sends
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <FlowDiagram />
      </div>
    </section>
  );
}

function Node({ icon: Icon, title, sub, strong = false }: { icon: typeof Laptop; title: string; sub: string; strong?: boolean }) {
  return (
    <div
      className={
        strong
          ? "relative z-10 flex items-center gap-3 rounded-lg bg-brand px-4 py-3 text-brand-foreground shadow-[var(--shadow-2)]"
          : "relative z-10 flex items-center gap-3 rounded-lg bg-surface px-4 py-3 shadow-[inset_0_0_0_1px_var(--border-strong),var(--shadow-1)]"
      }
    >
      <Icon size={18} strokeWidth={1.9} aria-hidden />
      <span>
        <span className="block text-[14px] font-semibold tracking-[-0.01em]">{title}</span>
        <span className={strong ? "block text-[12px] opacity-80" : "block text-[12px] text-muted-foreground"}>{sub}</span>
      </span>
    </div>
  );
}

/** A still diagram: file in, the tab does the work, result out. The server path is drawn and crossed out. */
function FlowDiagram() {
  return (
    <div className="ground-grid relative rounded-2xl bg-well p-6 shadow-[inset_0_0_0_1px_var(--border)] sm:p-10" role="img" aria-label="Your file goes into the browser tab, the tool runs there, and the result comes back. Nothing goes to a server.">
      <div aria-hidden className="relative mx-auto grid max-w-[420px] gap-10">
        <div className="relative flex items-center justify-between gap-3">
          <Node icon={Server} title="A server" sub="Not used" />
          <span className="relative z-10 rounded-full bg-surface px-2.5 py-1 font-mono text-[11px] text-status-bad shadow-[inset_0_0_0_1px_var(--border)]">0 bytes</span>
        </div>
        <svg className="absolute top-[52px] left-[38px] h-[60px] w-4 text-status-bad" viewBox="0 0 16 60" fill="none">
          <path d="M8 0v60" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" />
          <path d="M3 25l10 10M13 25L3 35" stroke="currentColor" strokeWidth="1.75" />
        </svg>
        <Node icon={Laptop} title="This browser tab" sub="The tool runs here" strong />
        <div className="grid grid-cols-2 gap-3">
          <Node icon={FileUp} title="Your file" sub="invoice.pdf" />
          <Node icon={Sparkles} title="The result" sub="Ready to save" />
        </div>
        <svg className="absolute bottom-[58px] left-1/4 h-10 w-1/2 text-brand-text" viewBox="0 0 200 40" preserveAspectRatio="none" fill="none">
          <path d="M10 40V20H95V0M190 40V20H105V0" stroke="currentColor" strokeWidth="1.5" className="pulse-line" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </div>
  );
}
