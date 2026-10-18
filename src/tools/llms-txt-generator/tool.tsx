"use client";

import { useRef, useState } from "react";
import { ActionButton, TextInput, TextArea } from "@/components/kit/controls";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/kit/copy-button";
import { downloadText } from "@/components/kit/download-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { SkeletonRows } from "@/components/kit/skeleton-rows";
import { Pane, ResultsTable, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { postTool } from "@/lib/post-tool";

type Result = { pages: number; llms: string; full: string; sources?: string[] };

export default function LlmsTool() {
  const [mode, setMode] = useState<"site" | "urls">("site");
  const [url, setUrl] = useState("");
  const [urls, setUrls] = useState("");
  const [llms, setLlms] = useState("");
  const [full, setFull] = useState("");
  const [file, setFile] = useState<"llms" | "full">("llms");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pages, setPages] = useState(0);
  const [sources, setSources] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [fetchedUrl, setFetchedUrl] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const text = file === "llms" ? llms : full;
  const ready = mode === "site" ? url.trim().length > 0 : urls.trim().length > 0;
  const blocked = /private/i.test(error);

  async function run() {
    if (!ready) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError("");
    const started = performance.now();
    try {
      const result = await postTool<Result>("/api/tools/llms-txt", { mode, url, urls }, controller.signal);
      setLlms(result.llms);
      setFull(result.full);
      setPages(result.pages);
      setSources(result.sources ?? []);
      setFetchedUrl(mode === "site" ? url.trim() : "pasted URLs");
      setElapsed(performance.now() - started);
    } catch (cause) {
      if (isAbort(cause)) return;
      setLlms("");
      setFull("");
      setError(shownError(cause, "The generator failed."));
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
      if (!text) return;
      void navigator.clipboard.writeText(text).then(() => toast.success("File copied"));
    },
    onEscape: cancel,
  });

  const status = busy
    ? `GET ${url || "pasted URLs"}…`
    : error
      ? blocked
        ? "Refused · private address"
        : "Failed"
      : text
        ? `${fetchedUrl} · ${pages.toLocaleString("en-US")} pages · ${(elapsed / 1000).toFixed(1)} s`
        : "Waiting for a site URL";

  const sourceRows = (sources.length ? sources : ["Not recorded"]).map((source) => ({
    level: "info" as const,
    label: source,
    detail: source === "pasted URLs" ? "The list was sent as written." : "Read during this fetch.",
  }));

  return (
    <ToolCard>
      <ToolToolbar
        label="File"
        options={[{ value: "llms", label: "llms.txt" }, { value: "full", label: "llms-full.txt" }]}
        value={file}
        onChange={setFile}
        actions={
          busy ? (
            <ActionButton type="button" variant="outline" onClick={cancel}>Cancel</ActionButton>
          ) : (
            <ActionButton className="btn btn-ink" disabled={!text} onClick={() => downloadText(file === "llms" ? "llms.txt" : "llms-full.txt", text)}>Download</ActionButton>
          )
        }
      />
      <ToolPanes ratio="40/60">
        <Pane label="Source">
          <p className="text-[12.5px] text-muted-foreground">Submit a public site, or paste page URLs. You can edit the preview before you copy it.</p>
          <Segmented label="Source" value={mode} onChange={setMode} options={[{ value: "site", label: "Site URL" }, { value: "urls", label: "Paste URLs" }]} />
          {mode === "site" ? (
            <FieldRow label="Site URL" htmlFor="llms-url" help="A bare domain is fine. Up to 30 pages. Private addresses are refused." error={blocked ? error : undefined}>
              <TextInput ref={urlRef} id="llms-url" value={url} aria-invalid={blocked || undefined} onChange={(event) => setUrl(event.target.value)} autoFocus />
            </FieldRow>
          ) : (
            <FieldRow label="Page URLs" htmlFor="llms-urls" help="One URL per line, up to 30.">
              <TextArea id="llms-urls" value={urls} onChange={(event) => setUrls(event.target.value)} className="min-h-40" />
            </FieldRow>
          )}
          <ActionButton type="button" className="btn btn-ink h-11" aria-busy={busy} disabled={!ready || busy} onClick={() => void run()}>
            {busy ? "Working" : "Generate"}
          </ActionButton>
          <Notice tone="neutral" title="What is fetched" body="The server reads robots.txt and sitemap.xml, including Sitemap lines in robots.txt. If those are missing, it collects links from the homepage. Private addresses are refused." />
        </Pane>
        <Pane label="Preview">
          <div className="flex min-h-[280px] flex-col gap-3" aria-live="polite">
            {busy ? <SkeletonRows /> : text ? (
              <>
                <TextArea aria-label="Editable preview" value={text} onChange={(event) => (file === "llms" ? setLlms(event.target.value) : setFull(event.target.value))} className="min-h-64 font-mono text-xs" />
                <div className="flex flex-wrap gap-2">
                  <CopyButton value={text} label="Copy" toastMessage="File copied" />
                  <ActionButton type="button" variant="outline" onClick={() => downloadText(file === "llms" ? "llms.txt" : "llms-full.txt", text)}>Download</ActionButton>
                </div>
                <ul className="text-[13px]">
                  {sectionsIn(llms).map((section) => (
                    <li key={section.name} className="flex justify-between gap-3 border-t border-border py-2">
                      <span className="truncate" title={section.name}>{section.name}</span>
                      <span className="font-mono text-muted-foreground">{section.count}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <EmptyState art={<FileText size={22} />} title={error && !blocked ? "The generator failed." : blocked ? "Nothing fetched" : "The file shows up here"} hint={error || "Submit a public site, or paste page URLs. You can edit the preview before you copy it."} />
            )}
          </div>
        </Pane>
      </ToolPanes>
      {text ? <ResultsTable rows={sourceRows} /> : null}
      <StatusStrip note={status} tone={error || blocked ? "fail" : text ? "pass" : "warn"} trailing="⌘↵ generate · ⌘⇧C copy file · esc cancel">
        <div className="grid w-full gap-2 min-[700px]:w-auto min-[700px]:grid-cols-2">
          <ResultStat variant="well" label="Pages" value={pages.toLocaleString("en-US")} />
          <ResultStat variant="well" label="Duration" value={`${(elapsed / 1000).toFixed(1)} s`} />
        </div>
      </StatusStrip>
    </ToolCard>
  );
}

function sectionsIn(text: string) {
  const sections: { name: string; count: number }[] = [];
  let current: { name: string; count: number } | null = null;
  for (const line of text.split("\n")) {
    if (line.startsWith("## ")) {
      current = { name: line.slice(3).trim(), count: 0 };
      sections.push(current);
    } else if (current && line.startsWith("- ")) current.count += 1;
  }
  return sections;
}

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function shownError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  if (/private address/i.test(message)) return "Private addresses are refused.";
  if (message === "The check failed.") return fallback;
  return message || fallback;
}
