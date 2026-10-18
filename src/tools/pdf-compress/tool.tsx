"use client";

import { useState } from "react";
import { ActionButton } from "@/components/kit/controls";
import { Download } from "lucide-react";
import { downloadBytes } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat, SizeStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { formatBytes } from "@/lib/image-format";
import { TARGET_BYTES, compressPdf, type CompressPreset, type CompressResult } from "@/tools/pdf-compress/lib/compress";

type Source = { name: string; bytes: Uint8Array };

const targets = [
  { value: "none", label: "None" },
  { value: "500", label: "500 KB" },
  { value: "200", label: "200 KB" },
  { value: "100", label: "100 KB" },
] as const;

export default function PdfCompressTool() {
  const [source, setSource] = useState<Source | null>(null);
  const [preset, setPreset] = useState<CompressPreset>("medium");
  const [target, setTarget] = useState<(typeof targets)[number]["value"]>("none");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CompressResult | null>(null);

  async function addFile(file: File) {
    setError("");
    setResult(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (bytes.byteLength === 0) throw new Error(`${file.name || "This PDF"} is empty.`);
      setSource({ name: file.name || "document.pdf", bytes });
    } catch (caught) {
      setSource(null);
      setError(caught instanceof Error ? caught.message : "Could not read that PDF.");
    }
  }

  async function compress() {
    if (!source) return;
    setBusy(true);
    setError("");
    try {
      setResult(await compressPdf(source.bytes, { preset, targetBytes: TARGET_BYTES[target] }));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Could not compress that PDF.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!result || !source) return;
    const stem = source.name.replace(/\.pdf$/i, "") || "document";
    downloadBytes(`${stem}-compressed.pdf`, result.bytes, "application/pdf");
  }

  useWorkbenchKeys({ onEnter: () => { if (result) download(); else void compress(); } });

  const note = error || (busy ? "Compressing in this browser" : source ? `${source.name} · ${formatBytes(source.bytes.byteLength)}` : "The PDF stays in this browser");

  return (
    <ToolCard>
      <ToolToolbar
        actions={<ActionButton className="btn btn-ink" onClick={() => void compress()} disabled={busy || !source}>{busy ? "Compressing" : "Compress"}</ActionButton>}
      />
      <ToolPanes ratio="40/60">
        <Pane label="PDF">
          <Dropzone accept="application/pdf,.pdf" onFile={(file) => void addFile(file)} label={source ? source.name : "Drop a PDF. It stays in this browser."} invalid={Boolean(error) && !source} />
          {source ? <ResultStat label="Original" value={formatBytes(source.bytes.byteLength)} /> : <EmptyState title="No PDF yet" hint="Image-heavy files shrink the most. Text stays selectable." />}
          <FieldRow label="Preset" htmlFor="preset" help="Strong downsamples images. Light keeps more detail.">
            <Segmented label="Compression preset" value={preset} onChange={(value) => { setPreset(value); setResult(null); }} options={[
              { value: "light", label: "Light" },
              { value: "medium", label: "Medium" },
              { value: "strong", label: "Strong" },
            ]} />
          </FieldRow>
          <FieldRow label="Target size" htmlFor="target" help="The tool tries stronger settings until the file fits.">
            <Segmented label="Target size" value={target} onChange={(value) => { setTarget(value); setResult(null); }} options={[...targets]} />
          </FieldRow>
          {result ? <ResultStat variant="well" label="Images recompressed" value={`${result.recompressed}/${result.images}`} hint={`${result.pages} pages`} /> : null}
          <Notice tone="neutral" title="Nothing is uploaded." body="Document title, author, and subject are cleared when the compressed file is the one you download." />
        </Pane>
        <Pane label="Result">
          {error ? <Notice tone="bad" role="alert" title="Could not compress" body={error} /> : null}
          {result ? (
            <div className="flex flex-col gap-3">
              <SizeStat before={formatBytes(result.before)} after={formatBytes(result.after)} hint={result.saved ? `${result.percent}% smaller` : "No size change"} />
              <Notice tone={result.metTarget ? "ok" : "warn"} title={result.metTarget ? "Ready" : "Above the target"} body={result.note} />
              <ActionButton type="button" onClick={download}><Download />Download PDF</ActionButton>
            </div>
          ) : <EmptyState title="Nothing compressed yet" hint="Pick a preset, then compress. If a pass would grow the file, the original is kept." />}
        </Pane>
      </ToolPanes>
      <StatusStrip note={note} tone={error ? "warn" : "pass"} trailing="⌘↵ compress" />
    </ToolCard>
  );
}
