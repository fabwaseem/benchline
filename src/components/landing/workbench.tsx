import Link from "next/link";
import { ArrowUpRight, Braces, ClaudeLogo, FileText, KeyRound, ShieldCheck } from "kineticons";

const HEADER = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
const PAYLOAD = "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2NDAwMDAwMCwiZXhwIjoxNzY0MDA3MjAwfQ";
const SIGNATURE = "pAuiPKXALn_DshBwbXXJ-sQ0EgDhaJMY7s4iI3DpUVM";

const claims: { k: string; v: string; note?: string }[] = [
  { k: "sub", v: '"1234567890"' },
  { k: "name", v: '"Ada Lovelace"' },
  { k: "role", v: '"admin"' },
  { k: "iat", v: "1764000000", note: "Nov 24, 16:00 UTC" },
  { k: "exp", v: "1764007200", note: "in 2 hours" },
];

const tabs = [
  { label: "JWT decoder", icon: KeyRound, href: "/t/jwt-decoder", on: true },
  { label: "JSON formatter", icon: Braces, href: "/t/json-formatter" },
  { label: "PDF merge", icon: FileText, href: "/t/pdf-merge" },
  { label: "SSL checker", icon: ShieldCheck, href: "/t/ssl-checker" },
];

/** The hero's product picture: the real JWT decoder layout, drawn as live HTML. The whole frame opens the tool. */
export function Workbench() {
  return (
    <div data-enter className="relative min-w-0 lg:pt-8 lg:pr-6">
      <div aria-hidden className="pointer-events-none absolute -inset-10 -z-10 rounded-[40px] bg-[radial-gradient(60%_55%_at_55%_45%,color-mix(in_oklch,var(--lime)_22%,transparent),transparent_70%)] blur-2xl" />
      <Link
        href="/t/json-formatter"
        aria-label="Open the JSON formatter"
        className="absolute top-0 right-0 left-12 hidden opacity-60 transition-opacity hover:opacity-90 focus-visible:opacity-100 focus-visible:outline-none lg:block"
      >
        <div className="app-frame h-20">
        <div className="app-frame-bar">
          <i />
          <i />
          <i />
          <span className="ml-3 inline-flex items-center gap-1.5 text-[12px] text-faint">
            <Braces size={13} />
            JSON formatter
          </span>
        </div>
        </div>
      </Link>
      <div className="group app-frame relative shadow-[var(--in-hi),0_0_0_1px_color-mix(in_oklch,var(--lime)_28%,var(--border-strong)),var(--shadow-3)] transition-transform duration-200 hover:-translate-y-0.5">
        <div className="app-frame-bar">
          <i aria-hidden />
          <i aria-hidden />
          <i aria-hidden />
          <nav aria-label="Open a tool" className="ml-3 flex min-w-0 flex-1 gap-1 overflow-hidden">
            {tabs.map(({ label, icon: Icon, href, on }) => (
              <Link
                key={label}
                href={href}
                aria-current={on ? "page" : undefined}
                className={
                  on
                    ? "ki-trigger inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-surface px-2.5 text-[12px] font-medium text-foreground shadow-[inset_0_0_0_1px_var(--border-strong)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    : "ki-trigger hidden h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[12px] text-faint transition-colors hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:inline-flex"
                }
              >
                <Icon size={13} strokeWidth={2} aria-hidden />
                {label}
              </Link>
            ))}
          </nav>
          <Link
            href="/t/jwt-decoder"
            aria-label="Open the JWT decoder"
            className="ki-trigger grid size-7 shrink-0 place-items-center rounded-md text-faint transition-colors hover:bg-surface hover:text-brand-text focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <ArrowUpRight size={15} aria-hidden />
          </Link>
        </div>
        <Link href="/t/jwt-decoder" tabIndex={-1} aria-hidden className="block">
        <div>

          <div className="grid min-[640px]:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-border p-4 min-[640px]:border-r min-[640px]:border-b-0 sm:p-5">
              <p className="font-mono text-[10.5px] tracking-[0.12em] text-faint uppercase">Encoded token</p>
              <p className="mt-3 font-mono text-[12.5px] leading-[1.75] break-all">
                <span className="text-seg-header">{HEADER}</span>
                <span className="text-faint">.</span>
                <span className="text-seg-payload">{PAYLOAD}</span>
                <span className="text-faint">.</span>
                <span className="text-seg-signature">{SIGNATURE}</span>
                <span className="caret" />
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                <span className="chip">
                  <span className="dot" />
                  Signature valid
                </span>
                <span className="chip">HS256</span>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <p className="font-mono text-[10.5px] tracking-[0.12em] text-faint uppercase">Header</p>
              <div className="mt-2 rounded-md bg-well px-3 py-2 font-mono text-[12.5px] leading-6 shadow-[inset_0_0_0_1px_var(--border)]">
                <span className="text-faint">{"{ "}</span>
                <span className="text-seg-header">&quot;alg&quot;</span>: &quot;HS256&quot;, <span className="text-seg-header">&quot;typ&quot;</span>: &quot;JWT&quot;
                <span className="text-faint">{" }"}</span>
              </div>
              <p className="mt-4 font-mono text-[10.5px] tracking-[0.12em] text-faint uppercase">Payload</p>
              <ul className="mt-2 overflow-hidden rounded-md bg-well font-mono text-[12.5px] shadow-[inset_0_0_0_1px_var(--border)]">
                {claims.map((claim, index) => (
                  <li
                    key={claim.k}
                    className="flex items-center gap-3 border-b border-border px-3 py-[7px] last:border-b-0"
                    style={{ animation: `scan-row 3.2s ${index * 0.32}s infinite` }}
                  >
                    <span className="w-10 shrink-0 text-seg-payload">{claim.k}</span>
                    <span className="min-w-0 flex-1 truncate">{claim.v}</span>
                    {claim.note ? <span className="hidden shrink-0 text-[11px] text-faint sm:inline">{claim.note}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border bg-well px-4 py-2.5 font-mono text-[11px] text-faint">
            <span className="inline-flex items-center gap-2">
              <span className="dot" />
              Decoded in this tab · 0 bytes sent
            </span>
            <span className="hidden sm:inline">decode_jwt over MCP</span>
          </div>
        </div>
        </Link>
      </div>
      <div
        aria-hidden
        className="absolute -bottom-6 -left-4 hidden w-[280px] rounded-xl bg-raised p-3.5 shadow-[inset_0_0_0_1px_var(--border-strong),var(--shadow-3)] lg:block xl:-left-10"
      >
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-sunken shadow-[inset_0_0_0_1px_var(--border)]">
            <ClaudeLogo size={17} trigger="loop" loopEvery={3200} />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold">Claude called a tool</span>
            <span className="block font-mono text-[11px] text-faint">tools/call · decode_jwt</span>
          </span>
          <span className="ml-auto rounded-full bg-brand-wash px-2 py-0.5 font-mono text-[10.5px] font-medium text-brand-text">14 ms</span>
        </div>
      </div>
    </div>
  );
}
