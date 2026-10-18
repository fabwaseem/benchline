"use client";

import { useEffect, useState } from "react";
import { Network } from "lucide-react";
import { TextArea, TextButton } from "@/components/kit/controls";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultTable } from "@/components/kit/result-table";
import { Pane, StatusStrip, ToolCard, ToolPanes } from "@/components/kit/shell";
import {
  analyzeHarText,
  formatBytes,
  formatDuration,
  type HarAnalysis,
  type HarEntry,
  type HarTimings,
} from "@/tools/har-analyzer/lib/har";

const PHASES: Array<{ key: keyof HarTimings; label: string; bar: string }> = [
  { key: "blocked", label: "Blocked", bar: "bg-muted" },
  { key: "dns", label: "DNS", bar: "bg-warning" },
  { key: "connect", label: "Connect", bar: "bg-destructive" },
  { key: "send", label: "Send", bar: "bg-primary" },
  { key: "wait", label: "Wait", bar: "bg-success" },
  { key: "receive", label: "Receive", bar: "bg-brand" },
];

const GROUPS: Array<{ key: "2xx" | "3xx" | "4xx" | "5xx" | "other"; label: string; bar: string }> = [
  { key: "2xx", label: "2xx", bar: "bg-status-ok" },
  { key: "3xx", label: "3xx", bar: "bg-status-warn" },
  { key: "4xx", label: "4xx", bar: "bg-warning" },
  { key: "5xx", label: "5xx", bar: "bg-status-bad" },
  { key: "other", label: "Other", bar: "bg-muted" },
];

function shortUrl(url: string): string {
  return url.length > 72 ? `${url.slice(0, 72)}…` : url;
}

function TimingBar({ entry }: { entry: HarEntry }) {
  const total = PHASES.reduce((sum, phase) => sum + entry.timings[phase.key], 0);
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={`Timing breakdown, total ${formatDuration(total)}`}>
        {PHASES.map((phase) => {
          const value = entry.timings[phase.key];
          if (value <= 0 || total <= 0) return null;
          return <div key={phase.key} className={`h-full ${phase.bar}`} style={{ width: `${(value / total) * 100}%` }} title={`${phase.label}: ${formatDuration(value)}`} />;
        })}
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
        {PHASES.map((phase) => (
          <li key={phase.key} className="flex items-center gap-2 text-[12px]">
            <span className={`h-2 w-2 shrink-0 rounded-sm ${phase.bar}`} aria-hidden />
            <span className="text-muted-foreground">{phase.label}</span>
            <span className="ml-auto font-mono">{formatDuration(entry.timings[phase.key])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HarAnalyzerTool() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [analysis, setAnalysis] = useState<HarAnalysis | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const kick = window.setTimeout(() => {
      setAnalysis(text.trim() ? analyzeHarText(text) : null);
      setSelected(null);
    }, 200);
    return () => window.clearTimeout(kick);
  }, [text]);

  function onFile(file: File) {
    setFileName(file.name);
    void file.text().then((content) => setText(content));
  }

  const summary = analysis && !("error" in analysis) ? analysis.summary : null;
  const entries = analysis && !("error" in analysis) ? analysis.entries : [];
  const selectedEntry = selected !== null ? entries.find((entry) => entry.index === selected) ?? null : null;
  const errorCount = summary ? summary.statusGroups["4xx"] + summary.statusGroups["5xx"] : 0;
  const maxGroup = summary ? Math.max(1, ...GROUPS.map((group) => summary.statusGroups[group.key])) : 1;

  return (
    <ToolCard>
      <ToolPanes>
        <Pane label="Capture">
          <Dropzone
            accept=".har,application/json"
            label={fileName || "Drop a .har file"}
            hint="or paste the JSON below · stays in this browser"
            onFile={onFile}
            maxSize={10 * 1024 * 1024}
          />
          <FieldRow label="HAR JSON" htmlFor="har-text">
            <TextArea
              id="har-text"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setFileName("");
              }}
              rows={16}
              spellCheck={false}
              placeholder='{"log": {"entries": […]}}'
              className="font-mono text-[12px]"
            />
          </FieldRow>
        </Pane>
        <Pane label="Analysis">
          {!analysis ? (
            <EmptyState art={<Network size={22} />} title="No capture yet" hint="Drop a .har file or paste HAR JSON to analyze it." />
          ) : "error" in analysis ? (
            <Notice tone="bad" role="alert" title="Could not analyze" body={analysis.error} />
          ) : summary ? (
            <>
              {summary.truncated ? (
                <Notice tone="warn" title="Truncated" body={`Showing the first 2,000 of the capture's entries.`} />
              ) : null}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Requests", value: String(summary.totalRequests) },
                  { label: "Total time", value: formatDuration(summary.totalTimeMs) },
                  { label: "Transferred", value: formatBytes(summary.totalBytes) },
                  { label: "4xx + 5xx", value: String(errorCount) },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-border bg-surface px-3 py-2.5">
                    <div className="font-mono text-[18px] font-semibold">{stat.value}</div>
                    <div className="text-[11.5px] text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="mb-1.5 font-mono text-[11px] tracking-[0.08em] text-faint uppercase">Status codes</div>
                <div className="flex flex-col gap-1.5">
                  {GROUPS.map((group) => {
                    const count = summary.statusGroups[group.key];
                    return (
                      <div key={group.key} className="flex items-center gap-2 text-[12px]">
                        <span className="w-10 shrink-0 font-mono text-muted-foreground">{group.label}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full ${group.bar}`} style={{ width: `${(count / maxGroup) * 100}%` }} />
                        </div>
                        <span className="w-12 shrink-0 text-right font-mono">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="mb-1.5 font-mono text-[11px] tracking-[0.08em] text-faint uppercase">Slowest requests</div>
                <ResultTable
                  caption="Slowest requests"
                  columns={[
                    { key: "url", label: "URL" },
                    { key: "status", label: "Status", className: "w-16" },
                    { key: "time", label: "Time", className: "w-20 text-right" },
                  ]}
                  rows={summary.slowest.map((entry) => ({
                    key: `slow-${entry.index}`,
                    cells: [
                      <span key="u" className="break-all font-mono text-[12px]" title={entry.url}>{shortUrl(entry.url)}</span>,
                      <span key="s" className="font-mono text-[12px]">{entry.status}</span>,
                      <span key="t" className="font-mono text-[12px]">{formatDuration(entry.timeMs)}</span>,
                    ],
                  }))}
                />
              </div>
              <div>
                <div className="mb-1.5 font-mono text-[11px] tracking-[0.08em] text-faint uppercase">Largest payloads</div>
                <ResultTable
                  caption="Largest payloads"
                  columns={[
                    { key: "url", label: "URL" },
                    { key: "mime", label: "Type", className: "w-32" },
                    { key: "size", label: "Size", className: "w-20 text-right" },
                  ]}
                  rows={summary.largest.map((entry) => ({
                    key: `large-${entry.index}`,
                    cells: [
                      <span key="u" className="break-all font-mono text-[12px]" title={entry.url}>{shortUrl(entry.url)}</span>,
                      <span key="m" className="truncate font-mono text-[12px]">{entry.mimeType || "—"}</span>,
                      <span key="s" className="font-mono text-[12px]">{formatBytes(entry.sizeBytes)}</span>,
                    ],
                  }))}
                />
              </div>
              <div>
                <div className="mb-1.5 font-mono text-[11px] tracking-[0.08em] text-faint uppercase">
                  All requests · click a row for timings
                </div>
                <ResultTable
                  caption="All requests"
                  columns={[
                    { key: "method", label: "Method", className: "w-16" },
                    { key: "url", label: "URL" },
                    { key: "status", label: "Status", className: "w-16" },
                    { key: "size", label: "Size", className: "w-20 text-right" },
                    { key: "time", label: "Time", className: "w-20 text-right" },
                  ]}
                  rows={entries.slice(0, 200).map((entry) => ({
                    key: `row-${entry.index}`,
                    cells: [
                      <TextButton key="m" className="font-mono text-[12px] font-semibold" onClick={() => setSelected(entry.index)}>{entry.method}</TextButton>,
                      <TextButton key="u" className="block w-full truncate text-left font-mono text-[12px]" title={entry.url} onClick={() => setSelected(entry.index)}>{shortUrl(entry.url)}</TextButton>,
                      <span key="s" className="font-mono text-[12px]">{entry.status}</span>,
                      <span key="z" className="font-mono text-[12px]">{formatBytes(entry.sizeBytes)}</span>,
                      <span key="t" className="font-mono text-[12px]">{formatDuration(entry.timeMs)}</span>,
                    ],
                  }))}
                />
                {entries.length > 200 ? (
                  <div className="mt-1 text-[12px] text-muted-foreground">Showing the first 200 of {entries.length} requests.</div>
                ) : null}
              </div>
              {selectedEntry ? (
                <div className="rounded-xl border border-border bg-surface p-3">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <span className="truncate font-mono text-[12px] font-medium" title={selectedEntry.url}>{shortUrl(selectedEntry.url)}</span>
                    <span className="shrink-0 font-mono text-[12px] text-muted-foreground">{formatDuration(selectedEntry.timeMs)} total</span>
                  </div>
                  <TimingBar entry={selectedEntry} />
                </div>
              ) : null}
            </>
          ) : null}
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={summary ? `${summary.totalRequests} requests · ${formatBytes(summary.totalBytes)}` : "Drop a HAR file to begin"}
        tone={analysis && "error" in analysis ? "warn" : "pass"}
      />
    </ToolCard>
  );
}
