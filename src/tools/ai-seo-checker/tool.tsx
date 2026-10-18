"use client";

import { useRef, useState } from "react";
import { ActionButton, TextInput } from "@/components/kit/controls";
import { Copy, Search } from "lucide-react";
import { toast } from "sonner";
import { CheckRows } from "@/components/kit/check-row";
import { CopyButton } from "@/components/kit/copy-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { ScoreRing } from "@/components/kit/score-ring";
import { SkeletonRows } from "@/components/kit/skeleton-rows";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { postTool } from "@/lib/post-tool";
import { seoVerdict } from "@/tools/ai-seo-checker/lib/score";

const CRAWLERS = ["GPTBot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "Applebot-Extended", "CCBot", "Bytespider"];

type Report = { finalUrl: string; status: number; score: number; checks: { level: "pass" | "warn" | "fail"; label: string; detail: string }[] };

const ORDER = { fail: 0, warn: 1, pass: 2 };

export default function AiSeoTool() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const blocked = /private|loopback/i.test(error);
  const rows = report ? [...report.checks].sort((a, b) => ORDER[a.level] - ORDER[b.level]) : [];
  const reportText = report
    ? [`Score ${report.score}`, report.finalUrl, ...report.checks.map((check) => `${check.level.toUpperCase()} ${check.label}: ${check.detail}`)].join("\n")
    : "";

  async function run() {
    if (!url.trim()) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError("");
    const started = performance.now();
    try {
      setReport(await postTool<Report>("/api/tools/ai-seo", { url }, controller.signal));
      setElapsed(performance.now() - started);
    } catch (cause) {
      if (isAbort(cause)) return;
      setReport(null);
      setError(shownError(cause));
    } finally {
      if (abortRef.current === controller) setBusy(false);
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setBusy(false);
    urlRef.current?.focus();
  }

  useWorkbenchKeys({
    onEnter: () => void run(),
    onCopy: () => {
      if (!reportText) return;
      void navigator.clipboard.writeText(reportText).then(() => toast.success("Report copied"));
    },
    onEscape: cancel,
  });

  const fails = report?.checks.filter((check) => check.level === "fail").length ?? 0;
  const status = busy
    ? `GET ${url}…`
    : blocked
      ? "Refused · loopback"
      : report
        ? `GET ${report.finalUrl} → ${report.status} · ${(elapsed / 1000).toFixed(1)} s${fails ? ` · ${fails} fails` : ""}`
        : "Waiting for a URL";

  return (
    <ToolShell
      runsLocally={false}
      busy={busy}
      layout="split+inspector"
      flow="band"
      columns="min-[1280px]:grid-cols-[340px_minmax(0,1fr)_320px]"
      tabs={<ToolTabs label="Mode" value="check" onChange={() => {}} options={[{ value: "check", label: "Check" }]} />}
      actions={busy ? <ActionButton type="button" variant="outline" className="h-[30px]" onClick={cancel}>Cancel</ActionButton> : <InkButton onClick={() => void navigator.clipboard.writeText(reportText).then(() => toast.success("Report copied"))} disabled={!reportText} icon={<Copy size={15} />}>Copy report</InkButton>}
      status={
        <>
          <span className={error ? "dot dot-warn" : "dot"} style={report && !error ? { background: "var(--success)" } : undefined} />
          <span>{status}</span>
          <span className="ml-auto hidden min-[700px]:inline">⌘↵ check · ⌘⇧C copy report</span>
        </>
      }
      input={
        <Panel title="Page">
          <p className="text-[12.5px] text-muted-foreground">Pass, warn, or fail for crawler access, llms.txt, structured data, and the on-page signals.</p>
          <FieldRow label="Page URL" htmlFor="seo-url" help="A bare domain is fine. The check reads the page, robots.txt, llms.txt, and the sitemap." error={blocked ? "Private addresses are refused." : undefined}>
            <TextInput ref={urlRef} id="seo-url" value={url} aria-invalid={blocked || undefined} autoFocus onChange={(event) => setUrl(event.target.value)} className="max-[699px]:h-11" />
          </FieldRow>
          <ActionButton type="button" className="btn btn-ink h-11" aria-busy={busy} disabled={!url.trim() || busy} onClick={() => void run()}>Check</ActionButton>
          <div className="flex flex-wrap gap-1.5">
            {CRAWLERS.map((name) => (
              <span key={name} className="chip">{name}</span>
            ))}
          </div>
        </Panel>
      }
      output={
        <div aria-live="polite" className="min-h-[280px]">
          {busy ? <SkeletonRows rows={8} /> : report ? (
            <CheckRows rows={rows} />
          ) : (
            <EmptyState art={<Search size={22} />} title={error && !blocked ? error : blocked ? "Nothing fetched" : "A score and a fix for each row"} hint="Pass, warn, or fail for crawler access, llms.txt, structured data, and the on-page signals." />
          )}
          {blocked ? <Notice className="m-4" tone="bad" role="alert" title="Private addresses are refused." /> : null}
        </div>
      }
      inspector={
        <Panel title="Score">
          {report ? (
            <>
              <div className="flex items-center gap-4">
                <ScoreRing score={report.score} />
                <div>
                  <p className="text-[18px] font-medium tracking-[-0.03em]">{seoVerdict(report.score, report.checks)}</p>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">Weighted across 8 signals. Not a ranking prediction.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ResultStat variant="well" label="Status" value={String(report.status)} />
                <ResultStat variant="well" label="Final URL" value={hostOf(report.finalUrl)} />
              </div>
              <CopyButton value={reportText} label="Copy report" toastMessage="Report copied" />
              <ActionButton type="button" variant="outline" onClick={() => void run()}>Re-run</ActionButton>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{busy ? "Scoring…" : "Not scored yet."}</p>
          )}
        </Panel>
      }
    />
  );
}

function hostOf(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function shownError(error: unknown) {
  const message = error instanceof Error ? error.message : "The check failed.";
  if (/private address/i.test(message)) return "Private addresses are refused.";
  return message;
}
