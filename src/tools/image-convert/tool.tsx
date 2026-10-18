"use client";

import { useState } from "react";
import { TextButton } from "@/components/kit/controls";
import { Images } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { BatchList } from "@/components/kit/batch-list";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { encoderSupports, fileToBitmap, renderToBlob } from "@/lib/client-image";
import { downloadBlob } from "@/lib/download-blob";
import { encoderQuality, formatBytes, IMAGE_ACCEPT, type OutputFormat } from "@/lib/image-format";
import { zipBlob } from "@/lib/zip-files";
import { conversionPlan, convertTargets } from "@/tools/image-convert/lib/convert";

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
};

const MAX_BATCH = 40;
const LABELS: Record<OutputFormat, string> = { jpeg: "JPG", png: "PNG", webp: "WebP", avif: "AVIF" };

function initialTarget(value: string | null): OutputFormat {
  if (value === "jpg" || value === "jpeg") return "jpeg";
  if (value === "png" || value === "webp" || value === "avif") return value;
  return "jpeg";
}

export default function ImageConvertTool() {
  const params = useSearchParams();
  const [target, setTarget] = useState<OutputFormat>(initialTarget(params.get("to")));
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);

  function forget(list: Job[]) {
    for (const job of list) {
      if (job.preview) URL.revokeObjectURL(job.preview);
    }
  }

  function addFiles(files: File[]) {
    setJobs((current) => {
      const room = MAX_BATCH - current.length;
      const next = files.slice(0, Math.max(0, room));
      if (next.length < files.length) toast.error(`Only ${MAX_BATCH} images at a time.`);
      const rows = next.map((file) => ({ id: crypto.randomUUID(), file, status: "queued" as const, width: 0, height: 0 }));
      for (const row of rows) void measure(row.id, row.file);
      return [...current, ...rows];
    });
  }

  function measure(id: string, file: File) {
    void fileToBitmap(file)
      .then((bitmap) => {
        const width = bitmap.width;
        const height = bitmap.height;
        bitmap.close();
        if (width < 1 || height < 1) return;
        setJobs((current) => current.map((job) => (job.id === id ? { ...job, width: job.width || width, height: job.height || height } : job)));
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "This file could not be decoded.";
        setJobs((current) => current.map((job) => (job.id === id ? { ...job, status: "error", error: message } : job)));
      });
  }

  async function convertAll() {
    if (busy || jobs.length === 0) return;
    const supported = await encoderSupports(target);
    if (!supported) {
      toast.error(`This browser cannot encode ${LABELS[target]}.`);
      return;
    }
    setBusy(true);
    for (const job of jobs) {
      setJobs((current) => current.map((row) => (row.id === job.id ? { ...row, status: "working", error: undefined } : row)));
      try {
        const bitmap = await fileToBitmap(job.file);
        const sourceWidth = bitmap.width;
        const sourceHeight = bitmap.height;
        try {
          const plan = conversionPlan(job.file.name, job.file.type, target);
          const blob = await renderToBlob({
            bitmap,
            width: sourceWidth,
            height: sourceHeight,
            format: target,
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
                error: undefined,
                width: sourceWidth,
                height: sourceHeight,
                output: blob,
                outputName: plan.filename,
                preview,
                after: blob.size,
              };
            });
          });
        } finally {
          bitmap.close();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not convert this file.";
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
    const files = await Promise.all(
      ready.map(async (job) => ({
        name: job.outputName ?? "image",
        data: new Uint8Array(await job.output!.arrayBuffer()),
      })),
    );
    downloadBlob("converted-images.zip", zipBlob(files));
    toast.success("Downloaded");
  }

  function clear() {
    setJobs((current) => {
      forget(current);
      return [];
    });
  }

  useWorkbenchKeys({ onEnter: () => void convertAll(), onEscape: clear });

  const done = jobs.filter((job) => job.status === "done").length;
  const saved = jobs.reduce((sum, job) => sum + (job.after ?? 0), 0);

  return (
    <ToolShell
      runsLocally
      busy={busy}
      layout="split+inspector"
      flow="band"
      tabs={<ToolTabs label="Mode" value="convert" onChange={() => {}} options={[{ value: "convert", label: "Convert" }]} />}
      actions={<InkButton icon={<Images size={15} />} disabled={busy || jobs.length === 0} onClick={() => void convertAll()}>{busy ? "Converting" : "Convert"}</InkButton>}
      status={
        <>
          <span className={busy ? "dot" : "dot"} />
          <span>{jobs.length === 0 ? "Waiting for images" : `${done}/${jobs.length} converted · ${LABELS[target]}`}</span>
          <span className="ml-auto hidden min-[700px]:inline">Files stay in this browser</span>
        </>
      }
      input={
        <Panel title="Images">
          <Notice tone="neutral" title="Nothing is uploaded." body="Conversion runs in this browser. Camera metadata, including GPS, is dropped." />
          <Segmented label="Target format" value={target} onChange={setTarget} options={convertTargets.map((format) => ({ value: format, label: LABELS[format] }))} />
          <Dropzone accept={IMAGE_ACCEPT} multiple label="Drop images, or click to choose a batch" onFiles={addFiles} />
          <p className="text-[12px] text-faint">HEIC uses the decoder on this device. If the browser cannot read it, export a JPEG from Photos first.</p>
        </Panel>
      }
      output={
        <Panel title="Converted">
          {jobs.length === 0 ? (
            <EmptyState art={<Images size={22} />} title="No images yet" hint="Drop HEIC, JPEG, PNG, WebP, AVIF, or GIF files. Pick a target, then convert." />
          ) : (
            <BatchList
              items={jobs.map((job) => ({
                id: job.id,
                name: job.outputName ?? job.file.name,
                status: job.status,
                error: job.error,
                preview: job.preview,
                meta: job.after
                  ? `${formatBytes(job.file.size)} → ${formatBytes(job.after)} · ${job.width}×${job.height}`
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
        </Panel>
      }
      inspector={
        <Panel title="Batch">
          <div className="grid grid-cols-2 gap-2">
            <ResultStat variant="well" label="Files" value={String(jobs.length)} />
            <ResultStat variant="well" label="Output" value={done ? formatBytes(saved) : "—"} hint={LABELS[target]} />
          </div>
          <InkButton icon={<Images size={15} />} disabled={done === 0} onClick={() => void saveZip()}>Download ZIP</InkButton>
          <TextButton onClick={clear} disabled={jobs.length === 0}>
            Clear the batch
          </TextButton>
        </Panel>
      }
    />
  );
}
