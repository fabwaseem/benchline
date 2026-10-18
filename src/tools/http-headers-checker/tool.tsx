"use client";

import { useRef, useState } from "react";
import { Waypoints } from "lucide-react";
import { ActionButton, TextInput } from "@/components/kit/controls";
import { CheckRows } from "@/components/kit/check-row";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { ResultTable } from "@/components/kit/result-table";
import { SkeletonRows } from "@/components/kit/skeleton-rows";
import { Panel, ToolShell, useWorkbenchKeys } from "@/components/kit/tool-shell";
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

export default function HeadersTool() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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

  useWorkbenchKeys({ onEnter: () => void run(), onEscape: () => abortRef.current?.abort() });

  return (
    <ToolShell
      runsLocally={false}
      busy={busy}
      layout="split"
      status={
        <>
          <span className={error ? "dot dot-warn" : "dot"} />
          <span>{busy ? "Fetching headers…" : error || (result ? `${result.status} · grade ${result.grade}` : "Waiting for a URL")}</span>
        </>
      }
      input={
        <Panel title="URL">
          <FieldRow label="Public URL" htmlFor="hdr-url" help="Private addresses are refused. The body is discarded." error={error || undefined}>
            <TextInput id="hdr-url" value={url} autoFocus className="font-mono" onChange={(event) => setUrl(event.target.value)} />
          </FieldRow>
          <ActionButton disabled={!url.trim() || busy} onClick={() => void run()}>Check headers</ActionButton>
        </Panel>
      }
      output={
        <Panel title="Response">
          {busy ? <SkeletonRows /> : result ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <ResultStat label="Grade" value={result.grade} />
                <ResultStat label="Status" value={String(result.status)} hint={result.finalUrl} />
              </div>
              {result.redirects.length > 0 ? (
                <ResultTable
                  caption="Redirects"
                  columns={[{ key: "status", label: "Status" }, { key: "location", label: "Location" }]}
                  rows={result.redirects.map((hop) => ({ key: hop.url, cells: [String(hop.status), hop.location] }))}
                />
              ) : null}
              <ResultTable
                caption="Headers"
                columns={[{ key: "name", label: "Name" }, { key: "value", label: "Value" }]}
                rows={result.headers.map((header, index) => ({ key: `${header.name}-${index}`, cells: [header.name, header.value] }))}
              />
              <CheckRows rows={result.checks} />
            </>
          ) : (
            <EmptyState art={<Waypoints size={22} />} title={error || "Headers show up here"} hint="Redirects, the header table, and a grade for HSTS, CSP, framing, nosniff, and Referrer-Policy." />
          )}
          {error ? <Notice tone="bad" role="alert" title="The check failed." body={error} /> : null}
        </Panel>
      }
    />
  );
}
