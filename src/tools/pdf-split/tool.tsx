"use client";

import { useState } from "react";
import { ActionButton, TextInput } from "@/components/kit/controls";
import { Download } from "lucide-react";
import { downloadBytes } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { FileList } from "@/components/kit/file-list";
import { Notice } from "@/components/kit/notice";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { formatBytes } from "@/lib/image-format";
import { inspectPdf, splitPdf, type SplitMode, type SplitResult } from "@/tools/pdf-split/lib/split";

type Source = { name: string; bytes: Uint8Array; pageCount: number };

export default function PdfSplitTool() {
  const [source, setSource] = useState<Source | null>(null);
  const [range, setRange] = useState("");
  const [mode, setMode] = useState<SplitMode>("extract");
  const [every, setEvery] = useState("2");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SplitResult | null>(null);

  async function addFile(file: File) {
    setError("");
    setResult(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const info = await inspectPdf(bytes, file.name || "This PDF");
      setSource({ name: file.name || "document.pdf", bytes, pageCount: info.pageCount });
    } catch (caught) {
      setSource(null);
      setError(caught instanceof Error ? caught.message : "Could not read that PDF.");
    }
  }

  async function split() {
    if (!source) return;
    setBusy(true);
    setError("");
    try {
      const chunk = Number(every);
      setResult(await splitPdf(source.bytes, { range, mode, every: chunk, name: source.name }));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Could not split that PDF.");
    } finally {
      setBusy(false);
    }
  }

  function downloadAll() {
    if (!result) return;
    if (result.zip) downloadBytes(source?.name.replace(/\.pdf$/i, "") + "-split.zip" || "split.zip", result.zip, "application/zip");
    else if (result.files[0]) downloadBytes(result.files[0].name, result.files[0].bytes, "application/pdf");
  }

  useWorkbenchKeys({ onEnter: () => { if (result) downloadAll(); else void split(); } });

  const note = error || (busy ? "Splitting in this browser" : source ? `${source.name} · ${source.pageCount} pages` : "The PDF stays in this browser");

  return (
    <ToolCard>
      <ToolToolbar
        label="Mode"
        options={[{ value: "extract", label: "One file" }, { value: "pages", label: "Every page" }, { value: "chunks", label: "Every N" }]}
        value={mode}
        onChange={(value) => { setMode(value); setResult(null); }}
        actions={<ActionButton className="btn btn-ink" onClick={() => void split()} disabled={busy || !source}>{busy ? "Splitting" : "Split"}</ActionButton>}
      />
      <ToolPanes>
        <Pane label="PDF">
          <Dropzone accept="application/pdf,.pdf" onFile={(file) => void addFile(file)} label={source ? source.name : "Drop a PDF. It stays in this browser."} invalid={Boolean(error) && !source} />
          <FieldRow label="Pages" htmlFor="range" help="Blank keeps every page. Example: 1-3,5">
            <TextInput id="range" value={range} placeholder="all pages" onChange={(event) => { setRange(event.target.value); setResult(null); }} />
          </FieldRow>
          {mode === "chunks" ? (
            <FieldRow label="Pages per file" htmlFor="every" help="A whole number from 1 to 500.">
              <TextInput id="every" inputMode="numeric" value={every} onChange={(event) => { setEvery(event.target.value); setResult(null); }} />
            </FieldRow>
          ) : null}
          {source ? <p className="truncate font-mono text-[12px] text-muted-foreground" title={`${source.pageCount} pages · ${formatBytes(source.bytes.byteLength)}`}>{source.pageCount} {source.pageCount === 1 ? "page" : "pages"} · {formatBytes(source.bytes.byteLength)}</p> : null}
          <Notice tone="neutral" title="Nothing is uploaded." body="The split runs in this tab." />
        </Pane>
        <Pane label="Files">
          {error ? <Notice tone="bad" role="alert" title="Could not split" body={error} /> : null}
          {result ? (
            <div className="flex flex-col gap-3">
              <FileList
                label="Split files"
                items={result.files.map((file) => ({
                  id: file.name,
                  name: file.name,
                  meta: formatBytes(file.bytes.byteLength),
                  trailing: <ActionButton variant="outline" size="sm" onClick={() => downloadBytes(file.name, file.bytes, "application/pdf")}>PDF</ActionButton>,
                }))}
              />
              <ActionButton type="button" onClick={downloadAll}><Download />{result.zip ? "Download ZIP" : "Download PDF"}</ActionButton>
            </div>
          ) : <EmptyState title="Nothing split yet" hint="Choose a range and a mode, then split. Several files become a ZIP." />}
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={note}
        tone={error ? "warn" : "pass"}
        trailing="⌘↵ split"
        items={[{ level: "info", label: "Mode", detail: mode === "extract" ? "One PDF" : mode === "pages" ? "A page each" : `Every ${every || "N"}` }]}
      />
    </ToolCard>
  );
}
