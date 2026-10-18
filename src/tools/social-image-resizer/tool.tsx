"use client";

import { useState } from "react";
import { Crosshair, Download } from "lucide-react";
import { ActionButton, ChipButton, Slider } from "@/components/kit/controls";
import { downloadBytes } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { fileToBitmap } from "@/lib/client-image";
import { formatBytes, IMAGE_ACCEPT } from "@/lib/image-format";
import { coverCrop, presetById, SOCIAL_PRESETS, type SocialPresetId } from "@/tools/social-image-resizer/lib/social";

type Format = "png" | "jpeg";

const formats = ["png", "jpeg"] as const;
const labels: Record<Format, string> = { png: "PNG", jpeg: "JPG" };

type Result = {
  filename: string;
  bytes: Uint8Array;
  mime: string;
  width: number;
  height: number;
};

async function loadDimensions(file: File) {
  const bitmap = await fileToBitmap(file);
  const dims = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dims;
}

export default function SocialImageResizerTool() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("image");
  const [source, setSource] = useState<{ width: number; height: number } | null>(null);
  const [presetId, setPresetId] = useState<SocialPresetId>("instagram-post");
  const [focal, setFocal] = useState({ x: 0.5, y: 0.5 });
  const [format, setFormat] = useState<Format>("png");
  const [quality, setQuality] = useState(90);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const preset = presetById(presetId) ?? SOCIAL_PRESETS[0];
  const crop = source ? coverCrop(source.width, source.height, preset.width, preset.height, focal.x, focal.y) : null;

  async function load(next: File) {
    if (url) URL.revokeObjectURL(url);
    setFile(next);
    setUrl(URL.createObjectURL(next));
    setName(next.name.replace(/\.[^.]+$/, "") || "image");
    setFocal({ x: 0.5, y: 0.5 });
    setResult(null);
    setError("");
    try {
      setSource(await loadDimensions(next));
    } catch (caught) {
      setSource(null);
      setError(caught instanceof Error ? caught.message : "This file could not be decoded in the browser.");
    }
  }

  function pickFocal(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    setFocal({ x, y });
    setResult(null);
  }

  async function exportImage() {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    try {
      const bitmap = await fileToBitmap(file);
      try {
        const rect = coverCrop(bitmap.width, bitmap.height, preset.width, preset.height, focal.x, focal.y);
        const canvas = document.createElement("canvas");
        canvas.width = preset.width;
        canvas.height = preset.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("This browser cannot draw images.");
        const mime = format === "jpeg" ? "image/jpeg" : "image/png";
        if (format === "jpeg") {
          context.fillStyle = "rgb(255, 255, 255)";
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(bitmap, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, preset.width, preset.height);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, format === "jpeg" ? quality / 100 : undefined));
        if (!blob) throw new Error(`This browser cannot encode ${labels[format]}.`);
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const filename = `${name}-${preset.id}.${format === "jpeg" ? "jpg" : "png"}`;
        const next = { filename, bytes, mime, width: preset.width, height: preset.height };
        setResult(next);
        downloadBytes(filename, bytes, mime);
      } finally {
        bitmap.close();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not export that image.");
    } finally {
      setBusy(false);
    }
  }

  function downloadAgain() {
    if (result) downloadBytes(result.filename, result.bytes, result.mime);
  }

  useWorkbenchKeys({ onEnter: () => void exportImage() });

  return (
    <ToolCard>
      <ToolToolbar
        actions={
          <ActionButton className="btn btn-ink" disabled={!file || busy} onClick={() => void exportImage()}>
            {busy ? "Exporting" : "Export image"}
          </ActionButton>
        }
      />
      <ToolPanes ratio="40/60">
        <Pane label="Image and preset">
          <Dropzone accept={IMAGE_ACCEPT} label={url ? "Replace the image" : "Drop an image, or click to choose one"} onFile={(next) => void load(next)} invalid={Boolean(error)} />
          <FieldRow label="Platform preset" help="Exact platform dimensions. The crop fills this frame.">
            <div className="grid grid-cols-2 gap-1.5">
              {SOCIAL_PRESETS.map((item) => (
                <ChipButton key={item.id} pressed={presetId === item.id} onClick={() => { setPresetId(item.id); setResult(null); }} className="flex-col items-start gap-0.5 py-2">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-[11px] text-faint">{item.width}×{item.height}</span>
                </ChipButton>
              ))}
            </div>
          </FieldRow>
          <Segmented label="Format" value={format} onChange={(next) => { setFormat(next); setResult(null); }} options={formats.map((item) => ({ value: item, label: labels[item] }))} />
          {format === "jpeg" ? (
            <FieldRow label="JPEG quality" htmlFor="social-quality" help="Higher quality means a bigger file.">
              <Slider id="social-quality" min={1} max={100} step={1} value={[quality]} onValueChange={([value]) => setQuality(value ?? 90)} />
            </FieldRow>
          ) : null}
          <Notice tone="neutral" title="Nothing is uploaded." body="The photo is decoded and resized in this tab." />
        </Pane>
        <Pane label="Crop preview">
          {error ? <Notice tone="bad" role="alert" title="Could not load" body={error} /> : null}
          {url && source && crop ? (
            <div className="flex flex-col gap-3">
              <div className="relative overflow-hidden rounded-lg bg-sunken">
                <div className="relative cursor-crosshair" onClick={pickFocal} title="Set the crop focal point">
                  <img src={url} alt="Source" className="block w-full" />
                  <div
                    className="pointer-events-none absolute border-2 border-dashed border-brand"
                    style={{
                      left: `${(crop.sx / source.width) * 100}%`,
                      top: `${(crop.sy / source.height) * 100}%`,
                      width: `${(crop.sw / source.width) * 100}%`,
                      height: `${(crop.sh / source.height) * 100}%`,
                    }}
                  />
                  <Crosshair
                    className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 text-brand drop-shadow"
                    style={{ left: `${focal.x * 100}%`, top: `${focal.y * 100}%` }}
                    aria-hidden
                  />
                </div>
              </div>
              <p className="text-[12px] text-faint">Click the photo to move the focal point. The dashed frame is the crop that will be exported.</p>
              {result ? (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <ResultStat label="Dimensions" value={`${result.width}×${result.height}`} />
                    <ResultStat label="File size" value={formatBytes(result.bytes.byteLength)} />
                  </div>
                  <ActionButton type="button" variant="outline" onClick={downloadAgain}><Download />Download again</ActionButton>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState art={<Crosshair size={22} />} title="No image yet" hint="Drop a photo, pick a preset, then click the preview to set the focal point." />
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={error || (busy ? "Exporting in this browser" : source ? `${preset.width}×${preset.height} · ${labels[format]}${format === "jpeg" ? ` · ${quality}` : ""}` : "Files stay in this browser")}
        tone={error ? "warn" : source ? "pass" : "info"}
        trailing="⌘↵ export"
        items={source ? [{ level: "info", label: "Source", detail: `${source.width}×${source.height}` }] : undefined}
      />
    </ToolCard>
  );
}
