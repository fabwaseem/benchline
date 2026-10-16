"use client";

import { useState } from "react";
import { CheckList } from "@/components/kit/check-list";
import { CopyButton } from "@/components/kit/copy-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { ResultStat } from "@/components/kit/result-stat";
import { ToolShell } from "@/components/kit/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postTool } from "@/lib/post-tool";

type Report = { finalUrl: string; status: number; score: number; checks: { level: "pass" | "warn" | "fail"; label: string; detail: string }[] };

export default function AiSeoTool() {
  const [url, setUrl] = useState("https://example.com");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setError("");
    try {
      setReport(await postTool<Report>("/api/tools/ai-seo", { url }));
    } catch (cause) {
      setReport(null);
      setError(cause instanceof Error ? cause.message : "The check failed.");
    } finally {
      setBusy(false);
    }
  }

  const reportText = report
    ? [`Score ${report.score}`, report.finalUrl, ...report.checks.map((check) => `${check.level.toUpperCase()} ${check.label}: ${check.detail}`)].join("\n")
    : "";

  return (
    <ToolShell
      runsLocally={false}
      actions={
        <>
          <CopyButton value={reportText} label="Copy report" />
          <Button type="button" variant="outline" onClick={() => void run()} disabled={busy}>Re-run</Button>
          <Button type="button" onClick={() => void run()} disabled={busy}>{busy ? "Checking" : "Check this URL"}</Button>
        </>
      }
      input={
        <FieldRow label="Page URL" htmlFor="seo-url" help="A bare domain is fine. The check reads the page, robots.txt, llms.txt, and the sitemap.">
          <Input id="seo-url" value={url} onChange={(event) => setUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void run(); }} />
        </FieldRow>
      }
      output={
        report ? (
          <div className="flex flex-col gap-3" aria-live="polite">
            <div className="grid grid-cols-2 gap-2">
              <ResultStat label="Score" value={String(report.score)} hint={report.finalUrl} />
              <ResultStat label="Status" value={String(report.status)} />
            </div>
            <CheckList rows={report.checks} />
          </div>
        ) : (
          <EmptyState title={error || "A score and a fix for each row"} hint="Pass, warn, or fail for crawler access, llms.txt, structured data, and the on-page signals." />
        )
      }
    />
  );
}
