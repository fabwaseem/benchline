"use client";

import { useState } from "react";
import { Scaling } from "lucide-react";
import { toast } from "sonner";
import { BatchList } from "@/components/kit/batch-list";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { encoderSupports, fileToBitmap, renderToBlob } from "@/lib/client-image";
import { downloadBlob } from "@/lib/download-blob";
import { encoderQuality, formatBytes, IMAGE_ACCEPT, outputFilename, resolveOutput, sniffFormat } from "@/lib/image-format";
import { zipBlob } from "@/lib/zip-files";
import { fitModes, parseDimension, placement, planResize, resizeModes, resizePresets, type FitMode, type ResizeMode } from "@/tools/image-resize/lib/resize";

type Job = {
  id: string;
  file: File;
  status: "queued" | "working" | "done" | "error";
  error?: string;
  width: number;
  height: number;
  outWidth?: number;
  outHeight?: number;
  output?: Blob;
  outputName?: string;
  preview?: string;
};

const MAX_BATCH = 40;
const FORMAT_CHOICES = ["original", "jpeg", "png", "webp", "avif"] as const;
type FormatChoice = (typeof FORMAT_CHOICES)[number];
const LABELS: Record<FormatChoice, string> = { original: "Original", jpeg: "JPG", png: "PNG", webp: "WebP", avif: "AVIF" };
const FIT_LABELS: Record<FitMode, string> = { contain: "Contain", cover: "Cover", stretch: "Stretch" };

export default function ImageResizeTool() {
  const [mode, setMode] = useState<ResizeMode>("pixels");
  const [widthText, setWidthText] = useState("1280");
  const [heightText, setHeightText] = useState("");
  const [percent, setPercent] = useState("50");
  const [lock, setLock] = useState(true);
  const [fit, setFit] = useState<FitMode>("contain");
  const [choice, setChoice] = useState<FormatChoice>("original");
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

  async function resizeAll() {
    if (busy || jobs.length === 0) return;
    setBusy(true);
    for (const job of jobs) {
      setJobs((current) => current.map((row) => (row.id === job.id ? { ...row, status: "working", error: undefined } : row)));
      try {
        const bitmap = await fileToBitmap(job.file);
        const sourceWidth = bitmap.width;
        const sourceHeight = bitmap.height;
        try {
          const size = planResize({
            sourceWidth,
            sourceHeight,
            mode,
            width: parseDimension(widthText),
            height: parseDimension(heightText),
            percent: Number(percent),
            lockAspect: lock,
          });
          const format = resolveOutput(sniffFormat(job.file.name, job.file.type), choice);
          const supported = await encoderSupports(format);
          if (!supported) throw new Error(`This browser cannot encode ${format === "jpeg" ? "JPEG" : format.toUpperCase()}.`);
          const frame = mode === "percent"
            ? { sx: 0, sy: 0, sw: sourceWidth, sh: sourceHeight, dx: 0, dy: 0, dw: size.width, dh: size.height }
            : placement(sourceWidth, sourceHeight, size.width, size.height, fit);
          const blob = await renderToBlob({
            bitmap,
            width: size.width,
            height: size.height,
            frame,
            format,
            quality: encoderQuality(92),
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
                outWidth: size.width,
                outHeight: size.height,
                output: blob,
                outputName: outputFilename(job.file.name, format),
                preview,
              };
            });
          });
        } finally {
          bitmap.close();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not resize this file.";
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
    downloadBlob("resized-images.zip", zipBlob(files));
    toast.success("Downloaded");
  }

  function clear() {
    setJobs((current) => {
      for (const job of current) if (job.preview) URL.revokeObjectURL(job.preview);
      return [];
    });
  }

  useWorkbenchKeys({ onEnter: () => void resizeAll(), onEscape: clear });

  const sample = jobs.find((job) => job.width > 0);
  const preview = sample
    ? planResize({
        sourceWidth: sample.width,
        sourceHeight: sample.height,
        mode,
        width: parseDimension(widthText),
        height: parseDimension(heightText),
        percent: Number(percent),
        lockAspect: lock,
      })
    : null;
  const done = jobs.filter((job) => job.status === "done").length;
  const formatLabel = choice;

  return (
    <ToolShell
      runsLocally
      busy={busy}
      layout="split+inspector"
      flow="band"
      tabs={<ToolTabs label="Mode" value="resize" onChange={() => {}} options={[{ value: "resize", label: "Resize" }]} />}
      actions={<InkButton icon={<Scaling size={15} />} disabled={busy || jobs.length === 0} onClick={() => void resizeAll()}>{busy ? "Resizing" : "Resize"}</InkButton>}
      status={
        <>
          <span className="dot" />
          <span>{preview ? `${done}/${jobs.length} resized · ${preview.width}×${preview.height}` : "Waiting for images"}</span>
          <span className="ml-auto hidden min-[700px]:inline">Files stay in this browser</span>
        </>
      }
      input={
        <Panel title="Size">
          <Notice tone="neutral" title="Nothing is uploaded." body="Leave one side empty to keep each image's ratio. Fill both sides to fit every image into the same frame." />
          <Segmented label="Resize by" value={mode} onChange={setMode} options={resizeModes.map((item) => ({ value: item, label: item === "pixels" ? "Pixels" : "Percent" }))} />
          <Dropzone accept={IMAGE_ACCEPT} multiple label="Drop images, or click to choose a batch" onFiles={addFiles} />
          {mode === "pixels" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Width" htmlFor="resize-w">
                  <Input id="resize-w" inputMode="numeric" value={widthText} placeholder="1280" onChange={(event) => setWidthText(event.target.value)} className="max-[699px]:h-11" />
                </FieldRow>
                <FieldRow label="Height" htmlFor="resize-h">
                  <Input id="resize-h" inputMode="numeric" value={heightText} placeholder="auto" onChange={(event) => setHeightText(event.target.value)} className="max-[699px]:h-11" />
                </FieldRow>
              </div>
              <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
                Lock aspect ratio
                <Switch checked={lock} onCheckedChange={setLock} />
              </label>
              <Segmented label="Fit" value={fit} onChange={setFit} options={fitModes.map((item) => ({ value: item, label: FIT_LABELS[item] }))} />
              <div className="flex flex-wrap gap-1.5">
                {resizePresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="chip"
                    data-on={widthText === String(preset.width) && heightText === String(preset.height) ? "true" : "false"}
                    onClick={() => {
                      setMode("pixels");
                      setWidthText(String(preset.width));
                      setHeightText(String(preset.height));
                      setLock(true);
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <FieldRow label="Percent" htmlFor="resize-pct" help="50 halves both sides. 200 doubles them. Each image keeps its ratio.">
              <Input id="resize-pct" inputMode="numeric" value={percent} onChange={(event) => setPercent(event.target.value)} className="max-[699px]:h-11" />
            </FieldRow>
          )}
        </Panel>
      }
      output={
        <Panel title="Resized">
          {jobs.length === 0 ? (
            <EmptyState art={<Scaling size={22} />} title="No images yet" hint="Drop a batch, set a width or a percent, and resize." />
          ) : (
            <BatchList
              items={jobs.map((job) => ({
                id: job.id,
                name: job.outputName ?? job.file.name,
                status: job.status,
                error: job.error,
                preview: job.preview,
                meta: job.outWidth
                  ? `${job.width}×${job.height} → ${job.outWidth}×${job.outHeight}`
                  : job.width
                    ? `${job.width}×${job.height} · ${formatBytes(job.file.size)}`
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
        </Panel>
      }
      inspector={
        <Panel title="Output">
          <Segmented label="Format" value={choice} onChange={setChoice} options={FORMAT_CHOICES.map((item) => ({ value: item, label: LABELS[item] }))} />
          <div className="grid grid-cols-2 gap-2">
            <ResultStat variant="well" label="Output" value={preview ? `${preview.width}×${preview.height}` : "—"} hint={sample ? "From the first image" : "Add an image"} />
            <ResultStat variant="well" label="Fit" value={mode === "percent" ? "Percent" : FIT_LABELS[fit]} hint={formatLabel === "original" ? "Keep format" : LABELS[formatLabel]} />
          </div>
          <InkButton icon={<Scaling size={15} />} disabled={done === 0} onClick={() => void saveZip()}>Download ZIP</InkButton>
          <button type="button" className="text-left text-[12px] text-muted-foreground" onClick={clear}>Clear the batch</button>
        </Panel>
      }
    />
  );
}
