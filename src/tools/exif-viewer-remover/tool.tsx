"use client";

import { useState } from "react";
import { Aperture } from "lucide-react";
import { toast } from "sonner";
import { ActionButton } from "@/components/kit/controls";
import { downloadBytes } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FileList } from "@/components/kit/file-list";
import { CodeOutput } from "@/components/kit/code-output";
import { Notice } from "@/components/kit/notice";
import { Pane, StatusStrip, ToolCard, ToolPanes } from "@/components/kit/shell";
import { fileToBitmap } from "@/lib/client-image";
import { formatBytes, IMAGE_ACCEPT } from "@/lib/image-format";
import type { ExifReport } from "@/tools/exif-viewer-remover/lib/read";

type Row = {
  id: string;
  file: File;
  report?: ExifReport;
  error?: string;
  cleaned?: { name: string; bytes: Uint8Array; mime: string };
};

const MAX_FILE = 40 * 1024 * 1024;

async function blobBytes(canvas: HTMLCanvasElement, type: string, quality?: number) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  if (!blob) throw new Error("This browser could not encode the image.");
  return new Uint8Array(await blob.arrayBuffer());
}

export default function ExifTool() {
  const [rows, setRows] = useState<Row[]>([]);
  const [active, setActive] = useState("");
  const [busy, setBusy] = useState(false);
  const current = rows.find((row) => row.id === active) ?? rows[0];

  async function addFiles(files: File[]) {
    const next = files.filter((file) => file.size <= MAX_FILE).slice(0, 20);
    if (next.length < files.length) toast.error("Up to 20 photos, 40 MB each.");
    const added: Row[] = next.map((file) => ({ id: crypto.randomUUID(), file }));
    setRows((list) => [...list, ...added].slice(0, 20));
    if (!active && added[0]) setActive(added[0].id);
    const { readExif } = await import("@/tools/exif-viewer-remover/lib/read");
    for (const row of added) {
      try {
        const report = await readExif(new Uint8Array(await row.file.arrayBuffer()));
        setRows((list) => list.map((item) => (item.id === row.id ? { ...item, report } : item)));
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Could not read metadata.";
        setRows((list) => list.map((item) => (item.id === row.id ? { ...item, error: message } : item)));
      }
    }
  }

  async function strip(scope: "all" | "gps") {
    if (!current) return;
    setBusy(true);
    try {
      const bytes = new Uint8Array(await current.file.arrayBuffer());
      if (scope === "gps") {
        const { isJpeg } = await import("@/tools/exif-viewer-remover/lib/tags");
        if (!isJpeg(bytes)) throw new Error("GPS-only removal works on JPEG. Use strip all for this file.");
        const { stripJpegGps } = await import("@/tools/exif-viewer-remover/lib/gps");
        const cleaned = stripJpegGps(bytes);
        const name = current.file.name.replace(/\.[^.]+$/, "") + "-no-gps.jpg";
        setRows((list) => list.map((item) => (item.id === current.id ? { ...item, cleaned: { name, bytes: cleaned, mime: "image/jpeg" } } : item)));
        toast.success("GPS removed");
        return;
      }
      const bitmap = await fileToBitmap(current.file);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("This browser could not redraw the photo.");
        const png = current.file.type === "image/png" || current.file.name.toLowerCase().endsWith(".png");
        if (!png) {
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.drawImage(bitmap, 0, 0);
        const mime = png ? "image/png" : "image/jpeg";
        const data = await blobBytes(canvas, mime, png ? undefined : 0.92);
        const ext = png ? "png" : "jpg";
        const name = `${current.file.name.replace(/\.[^.]+$/, "")}-clean.${ext}`;
        setRows((list) => list.map((item) => (item.id === current.id ? { ...item, cleaned: { name, bytes: data, mime } } : item)));
        toast.success("Metadata removed");
      } finally {
        bitmap.close();
      }
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not strip this photo.");
    } finally {
      setBusy(false);
    }
  }

  const report = current?.report;
  const tagText = report?.tags.map((tag) => `${tag.name}: ${tag.value}`).join("\n") ?? "";

  return (
    <ToolCard>
      <ToolPanes ratio="40/60">
        <Pane label="Photos">
          <Notice tone="neutral" title="Nothing is uploaded." body="GPS-only keeps the other JPEG tags. Strip all redraws the pixels, so every tag goes." />
          <Dropzone accept={IMAGE_ACCEPT} multiple label="Drop photos, or click to choose a batch" onFiles={(files) => void addFiles(files)} />
          <FileList
            label="Photos"
            items={rows.map((row) => ({
              id: row.id,
              name: row.file.name,
              meta: row.error ?? (row.report?.gps ? row.report.gps.label : row.report ? `${row.report.tags.length} tags` : "Reading"),
              onRemove: () => setRows((list) => list.filter((item) => item.id !== row.id)),
            }))}
          />
          {rows.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {rows.map((row) => (
                <ActionButton key={row.id} type="button" variant={row.id === current?.id ? "default" : "outline"} onClick={() => setActive(row.id)}>
                  {row.file.name}
                </ActionButton>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <ActionButton type="button" variant="outline" disabled={!current || busy} onClick={() => void strip("gps")}>Strip GPS</ActionButton>
            <ActionButton type="button" className="btn btn-ink" disabled={!current || busy} onClick={() => void strip("all")}>{busy ? "Stripping" : "Strip all"}</ActionButton>
          </div>
        </Pane>
        <Pane label="Tags">
          {!current ? (
            <EmptyState art={<Aperture size={22} />} title="No photo yet" hint="Drop a picture to see the camera, the time, and the GPS point." />
          ) : (
            <>
              {report?.gps ? (
                <Notice tone="warn" title={report.gps.label} body="This photo carries a location." />
              ) : (
                <Notice tone="ok" title="No GPS" body="No coordinates were found in this file." />
              )}
              {report?.gps ? (
                <a className="text-sm text-foreground underline" href={report.gps.map} target="_blank" rel="noreferrer">Open the point on a map</a>
              ) : null}
              {tagText ? <CodeOutput code={tagText} label="Tags" /> : <p className="text-sm text-muted-foreground">No readable tags.</p>}
              {current.cleaned ? (
                <ActionButton type="button" onClick={() => downloadBytes(current.cleaned!.name, current.cleaned!.bytes, current.cleaned!.mime)}>
                  Download {current.cleaned.name} · {formatBytes(current.cleaned.bytes.byteLength)}
                </ActionButton>
              ) : null}
            </>
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={report?.gps ? report.gps.label : current ? "No GPS" : "Waiting for photos"}
        tone={report?.gps ? "warn" : current ? "pass" : "info"}
        trailing="Stays in this browser"
        items={current ? [
          { level: "info" as const, label: "Camera", detail: report?.camera || "—" },
          { level: "info" as const, label: "When", detail: report?.when || "—" },
        ] : undefined}
      />
    </ToolCard>
  );
}
