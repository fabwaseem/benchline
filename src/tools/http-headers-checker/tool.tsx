"use client";

import { useRef, useState } from "react";
import { Waypoints } from "lucide-react";
import { ActionButton, TextInput } from "@/components/kit/controls";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { SkeletonRows } from "@/components/kit/skeleton-rows";
import { Pane, ResultsTable, ScoreCard, StatusStrip, ToolCard, ToolPanes } from "@/components/kit/shell";
import { Truncate } from "@/components/kit/shell/truncate";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { postTool } from "@/lib/post-tool";
import type { HeaderCheck, HeaderField, HeaderGrade } from "@/tools/http-headers-checker/lib/headers";

type Report = {
  finalUrl: string;
  status: number;
  redirects: { url: string; status: number; location: string }[];
  headers: HeaderField[];
  grade: HeaderGrade;
  checks: HeaderCheck[];
};

const GRADE_SCORE: Record<HeaderGrade, number> = { A: 96, B: 80, C: 64, D: 42, F: 18 };

export default function HeadersTool() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  async function run() {
    if (!url.trim()) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError("");
    try {
      setResult(await postTool<Report>("/api/tools/http-headers", { url }, controller.signal));
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setResult(null);
      setError(cause instanceof Error ? cause.message : "The check failed.");
    } finally {
      if (abortRef.current === controller) setBusy(false);
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setBusy(false);
    urlRef.current?.focus();
  }

  useWorkbenchKeys({ onEnter: () => void run(), onEscape: cancel });
  const note = busy ? "Fetching headers…" : error || (result ? `${result.status} · grade ${result.grade}` : "Waiting for a URL");

  return (
    <ToolCard>
      <div className="flex flex-col gap-3 border-b border-border p-3 min-[700px]:flex-row min-[700px]:items-end">
        <FieldRow label="Public URL" htmlFor="hdr-url" className="min-w-0 flex-1" help="Private addresses are refused. The body is discarded." error={error || undefined}>
          <TextInput ref={urlRef} id="hdr-url" value={url} autoFocus className="font-mono" aria-invalid={Boolean(error) || undefined} onChange={(event) => setUrl(event.target.value)} />
        </FieldRow>
        <div className="flex flex-wrap gap-2">
          <ActionButton type="button" className="btn btn-ink" disabled={!url.trim() || busy} onClick={() => void run()}>Check headers</ActionButton>
          {busy ? <ActionButton type="button" variant="outline" onClick={cancel}>Cancel</ActionButton> : null}
        </div>
      </div>
      <ToolPanes ratio="35/65">
        <Pane label="Response">
          {busy ? <SkeletonRows /> : result ? (
            <>
              <ScoreCard
                score={GRADE_SCORE[result.grade]}
                verdict={`Grade ${result.grade}`}
                caption={result.finalUrl}
                stats={[
                  { label: "Status", value: String(result.status) },
                  { label: "Redirects", value: String(result.redirects.length) },
                ]}
              />
              {result.redirects.length > 0 ? (
                <ul className="text-[13px]">
                  {result.redirects.map((hop) => (
                    <li key={hop.url} className="border-t border-border py-2">
                      <span className="font-mono">{hop.status}</span>
                      <Truncate value={hop.location} className="text-muted-foreground" />
                    </li>
                  ))}
                </ul>
              ) : null}
              <ul className="text-[13px]">
                {result.headers.map((header, index) => (
                  <li key={`${header.name}-${index}`} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-2 border-t border-border py-2">
                    <span className="truncate font-medium" title={header.name}>{header.name}</span>
                    <Truncate value={header.value} className="font-mono text-muted-foreground" />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyState art={<Waypoints size={22} />} title={error || "Headers show up here"} hint="Redirects, the header table, and a grade for HSTS, CSP, framing, nosniff, and Referrer-Policy." />
          )}
          {error ? <Notice tone="bad" role="alert" title="The check failed." body={error} /> : null}
        </Pane>
        <Pane label="Checks" padded={false} scroll={false} bodyClassName="flex min-h-[280px] flex-col">
          <div aria-live="polite" className="flex min-h-0 flex-1 flex-col">
            {result ? <ResultsTable rows={result.checks} empty="No header checks." /> : <p className="px-3 py-6 text-sm text-muted-foreground">{busy ? "Fetching headers…" : "Nothing checked yet."}</p>}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={note} tone={error ? "warn" : result ? (result.grade === "A" || result.grade === "B" ? "pass" : "warn") : "info"} trailing="⌘↵ check · esc cancel" />
    </ToolCard>
  );
}
