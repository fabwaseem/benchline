"use client";

import { useRef, useState } from "react";
import { ActionButton, TextInput } from "@/components/kit/controls";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { SkeletonRows } from "@/components/kit/skeleton-rows";
import { Pane, ResultsTable, ScoreCard, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
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
    <ToolCard>
      <ToolToolbar
        actions={
          busy ? (
            <ActionButton type="button" variant="outline" onClick={cancel}>Cancel</ActionButton>
          ) : (
            <ActionButton type="button" className="btn btn-ink" disabled={!reportText} onClick={() => void navigator.clipboard.writeText(reportText).then(() => toast.success("Report copied"))}>Copy report</ActionButton>
          )
        }
      />
      <div className="flex flex-col gap-3 border-b border-border p-3">
        <p className="text-[12.5px] text-muted-foreground">Pass, warn, or fail for crawler access, llms.txt, structured data, and the on-page signals.</p>
        <div className="flex flex-col gap-2 min-[700px]:flex-row min-[700px]:items-end">
          <FieldRow label="Page URL" htmlFor="seo-url" className="min-w-0 flex-1" help="A bare domain is fine. The check reads the page, robots.txt, llms.txt, and the sitemap." error={blocked ? "Private addresses are refused." : undefined}>
            <TextInput ref={urlRef} id="seo-url" value={url} aria-invalid={blocked || undefined} autoFocus onChange={(event) => setUrl(event.target.value)} />
          </FieldRow>
          <ActionButton type="button" className="btn btn-ink" aria-busy={busy} disabled={!url.trim() || busy} onClick={() => void run()}>Check</ActionButton>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CRAWLERS.map((name) => (
            <span key={name} className="chip" title={name}>{name}</span>
          ))}
        </div>
      </div>
      <ToolPanes ratio="35/65">
        <Pane label="Score">
          {report ? (
            <ScoreCard
              score={report.score}
              verdict={seoVerdict(report.score, report.checks)}
              caption="Weighted across 8 signals. Not a ranking prediction."
              stats={[
                { label: "Status", value: String(report.status) },
                { label: "Response", value: `${Math.round(elapsed)} ms` },
                { label: "Final URL", value: hostOf(report.finalUrl) },
              ]}
            >
              <ActionButton type="button" variant="outline" onClick={() => void run()}>Re-run</ActionButton>
            </ScoreCard>
          ) : (
            <p className="text-sm text-muted-foreground">{busy ? "Scoring…" : "Not scored yet."}</p>
          )}
        </Pane>
        <Pane label="Checks" padded={false} scroll={false} bodyClassName="flex min-h-[280px] flex-col">
          <div aria-live="polite" className="flex min-h-0 flex-1 flex-col">
            {busy ? <SkeletonRows rows={8} /> : report ? (
              <ResultsTable rows={rows} />
            ) : (
              <EmptyState art={<Search size={22} />} title={error && !blocked ? error : blocked ? "Nothing fetched" : "A score and a fix for each row"} hint="Pass, warn, or fail for crawler access, llms.txt, structured data, and the on-page signals." />
            )}
            {blocked ? <Notice className="m-4" tone="bad" role="alert" title="Private addresses are refused." /> : null}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={status} tone={error || fails ? "warn" : report ? "pass" : "info"} trailing="⌘↵ check · ⌘⇧C copy report" />
    </ToolCard>
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
