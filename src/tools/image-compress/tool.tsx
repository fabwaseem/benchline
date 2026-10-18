"use client";

import { useState } from "react";
import { ActionButton, Slider, TextButton, TextInput } from "@/components/kit/controls";
import { ImageDown } from "lucide-react";
import { toast } from "sonner";
import { BatchList } from "@/components/kit/batch-list";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat, SizeStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { encoderSupports, fileToBitmap, renderToBlob } from "@/lib/client-image";
import { downloadBlob } from "@/lib/download-blob";
import { capBox, encoderQuality, formatBytes, IMAGE_ACCEPT, outputFilename, savings } from "@/lib/image-format";
import { zipBlob } from "@/lib/zip-files";
import { compressChoices, compressionPlan, type CompressChoice } from "@/tools/image-compress/lib/compress";
import { parseDimension } from "@/tools/image-resize/lib/resize";

type Job = {
  id: string;
  file: File;
  status: "queued" | "working" | "done" | "error";
  error?: string;
  width: number;
  height: number;
  output?: Blob;
  outputName?: string;
  preview?: string;
  after?: number;
  label?: string;
};

const MAX_BATCH = 40;
const LABELS: Record<CompressChoice, string> = { original: "Original", jpeg: "JPG", png: "PNG", webp: "WebP", avif: "AVIF" };

export default function ImageCompressTool() {
  const [choice, setChoice] = useState<CompressChoice>("original");
  const [quality, setQuality] = useState(80);
  const [maxEdge, setMaxEdge] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);

  function addFiles(files: File[]) {
    setJobs((current) => {
      const room = MAX_BATCH - current.length;
      const next = files.slice(0, Math.max(0, room));
      if (next.length < files.length) toast.error(`Only ${MAX_BATCH} images at a time.`);
      const rows = next.map((file) => ({ id: crypto.randomUUID(), file, status: "queued" as const, width: 0, height: 0 }));
      for (const row of rows) {
        void fileToBitmap(row.file)
          .then((bitmap) => {
            const width = bitmap.width;
            const height = bitmap.height;
            bitmap.close();
            if (width < 1 || height < 1) return;
            setJobs((list) => list.map((job) => (job.id === row.id ? { ...job, width: job.width || width, height: job.height || height } : job)));
          })
          .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : "This file could not be decoded.";
            setJobs((list) => list.map((job) => (job.id === row.id ? { ...job, status: "error", error: message } : job)));
          });
      }
      return [...current, ...rows];
    });
  }

  async function compressAll() {
    if (busy || jobs.length === 0) return;
    const edge = parseDimension(maxEdge);
    setBusy(true);
    for (const job of jobs) {
      setJobs((current) => current.map((row) => (row.id === job.id ? { ...row, status: "working", error: undefined } : row)));
      try {
        const bitmap = await fileToBitmap(job.file);
        const sourceWidth = bitmap.width;
        const sourceHeight = bitmap.height;
        try {
          const plan = compressionPlan({
            filename: job.file.name,
            mime: job.file.type,
            choice,
            quality,
            sourceWidth,
            sourceHeight,
            maxEdge: edge,
            beforeBytes: job.file.size,
            afterBytes: job.file.size,
          });
          const supported = await encoderSupports(plan.format);
          if (!supported) throw new Error(`This browser cannot encode ${plan.format === "jpeg" ? "JPEG" : plan.format.toUpperCase()}.`);
          const box = capBox(sourceWidth, sourceHeight, edge);
          const blob = await renderToBlob({
            bitmap,
            width: box.width,
            height: box.height,
            frame: { sx: 0, sy: 0, sw: sourceWidth, sh: sourceHeight, dx: 0, dy: 0, dw: box.width, dh: box.height },
            format: plan.format,
            quality: encoderQuality(quality),
          });
          const done = compressionPlan({
            filename: job.file.name,
            mime: job.file.type,
            choice,
            quality,
            sourceWidth,
            sourceHeight,
            maxEdge: edge,
            beforeBytes: job.file.size,
            afterBytes: blob.size,
          });
          const preview = URL.createObjectURL(blob);
          setJobs((current) => {
            if (!current.some((row) => row.id === job.id)) {
              URL.revokeObjectURL(preview);
              return current;
            }
            return current.map((row) => {
              if (row.id !== job.id) return row;
              if (row.preview) URL.revokeObjectURL(row.preview);
              return {
                ...row,
                status: "done",
                width: sourceWidth,
                height: sourceHeight,
                output: blob,
                outputName: outputFilename(job.file.name, plan.format),
                preview,
                after: blob.size,
                label: done.label,
              };
            });
          });
        } finally {
          bitmap.close();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not compress this file.";
        setJobs((current) => current.map((row) => (row.id === job.id ? { ...row, status: "error", error: message } : row)));
      }
    }
    setBusy(false);
  }

  function save(id: string) {
    const job = jobs.find((row) => row.id === id);
    if (!job?.output || !job.outputName) return;
    downloadBlob(job.outputName, job.output);
    toast.success("Downloaded");
  }

  async function saveZip() {
    const ready = jobs.filter((job) => job.output && job.outputName);
    if (ready.length === 0) return;
    const files = await Promise.all(ready.map(async (job) => ({ name: job.outputName ?? "image", data: new Uint8Array(await job.output!.arrayBuffer()) })));
    downloadBlob("compressed-images.zip", zipBlob(files));
    toast.success("Downloaded");
  }

  function clear() {
    setJobs((current) => {
      for (const job of current) if (job.preview) URL.revokeObjectURL(job.preview);
      return [];
    });
  }

  useWorkbenchKeys({ onEnter: () => void compressAll(), onEscape: clear });

  const finishedJobs = jobs.filter((job) => job.after !== undefined);
  const before = finishedJobs.reduce((sum, job) => sum + job.file.size, 0);
  const after = finishedJobs.reduce((sum, job) => sum + (job.after ?? 0), 0);
  const finished = finishedJobs.length;
  const batchSavings = finished ? savings(before, after) : null;
  const outputNote = choice;

  return (
    <ToolCard>
      <ToolToolbar
        actions={
          <>
            <TextButton onClick={clear}>Clear</TextButton>
            <ActionButton variant="outline" disabled={finished === 0} onClick={() => void saveZip()}>Download ZIP</ActionButton>
            <ActionButton className="btn btn-ink" disabled={busy || jobs.length === 0} onClick={() => void compressAll()}>{busy ? "Compressing" : "Compress"}</ActionButton>
          </>
        }
      />
      <ToolPanes ratio="40/60">
        <Pane label="Images">
          <Notice tone="neutral" title="Nothing is uploaded." body="The quality slider applies to JPEG, WebP, and AVIF. PNG stays lossless unless you cap the long edge or change format." />
          <Segmented label="Format" value={choice} onChange={setChoice} options={compressChoices.map((item) => ({ value: item, label: LABELS[item] }))} />
          <Dropzone accept={IMAGE_ACCEPT} multiple label="Drop images, or click to choose a batch" onFiles={addFiles} />
          <FieldRow label={`Quality ${quality}`} htmlFor="quality" help="1 is smallest. 100 is highest quality.">
            <Slider id="quality" value={[quality]} min={1} max={100} onValueChange={(value) => setQuality(value[0] ?? 80)} />
          </FieldRow>
          <FieldRow label="Max edge" htmlFor="max-edge" help="Longest side in pixels. Leave empty to keep the original size.">
            <TextInput id="max-edge" inputMode="numeric" value={maxEdge} placeholder="1600" onChange={(event) => setMaxEdge(event.target.value)} />
          </FieldRow>
        </Pane>
        <Pane label="Compressed">
          {jobs.length === 0 ? (
            <EmptyState art={<ImageDown size={22} />} title="No images yet" hint="Drop a batch, set a quality, and compress. Each row shows the size before and after." />
          ) : (
            <BatchList
              items={jobs.map((job) => ({
                id: job.id,
                name: job.outputName ?? job.file.name,
                status: job.status,
                error: job.error,
                preview: job.preview,
                meta: job.after
                  ? `${formatBytes(job.file.size)} → ${formatBytes(job.after)} · ${job.label ?? ""}`
                  : job.width
                    ? `${formatBytes(job.file.size)} · ${job.width}×${job.height}`
                    : formatBytes(job.file.size),
              }))}
              onRemove={(id) =>
                setJobs((current) => {
                  const job = current.find((row) => row.id === id);
                  if (job?.preview) URL.revokeObjectURL(job.preview);
                  return current.filter((row) => row.id !== id);
                })
              }
              onSave={save}
            />
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip note={finished === 0 ? `${jobs.length} images · quality ${quality}` : `${finished} compressed · quality ${quality}`} tone="pass" trailing="Files stay in this browser">
        <div className="grid w-full gap-2 min-[700px]:w-auto min-[700px]:grid-cols-[minmax(0,16rem)_8rem]">
          <SizeStat
            before={jobs.length ? formatBytes(before) : "—"}
            after={finished ? formatBytes(after) : "—"}
            hint={outputNote === "original" ? "Per file" : LABELS[outputNote]}
          />
          <ResultStat label="Saved" value={batchSavings ? formatBytes(Math.abs(batchSavings.savedBytes)) : "—"} hint={batchSavings ? `${batchSavings.label} across the batch` : "Shown after compression"} />
        </div>
      </StatusStrip>
    </ToolCard>
  );
}
