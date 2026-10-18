"use client";

import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Crop } from "lucide-react";
import { toast } from "sonner";
import { ChipButton, OptionRow, Slider } from "@/components/kit/controls";
import { downloadBytes } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { fileToBitmap } from "@/lib/client-image";
import { IMAGE_ACCEPT } from "@/lib/image-format";
import { aspectPresets, aspectRatio, type AspectPreset, type CropFormat } from "@/tools/image-crop/lib/crop";

const formats = ["png", "jpeg", "webp"] as const;
const labels: Record<CropFormat, string> = { png: "PNG", jpeg: "JPG", webp: "WebP" };

async function exportCrop(file: File, pixels: Area, circle: boolean, format: CropFormat) {
  const bitmap = await fileToBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(pixels.width));
    canvas.height = Math.max(1, Math.round(pixels.height));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not crop the image.");
    if (format === "jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (circle) {
      context.beginPath();
      context.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2, 0, Math.PI * 2);
      context.clip();
    }
    context.drawImage(bitmap, pixels.x, pixels.y, pixels.width, pixels.height, 0, 0, canvas.width, canvas.height);
    const mime = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, 0.92));
    if (!blob) throw new Error(`This browser cannot encode ${labels[format]}.`);
    return { bytes: new Uint8Array(await blob.arrayBuffer()), mime };
  } finally {
    bitmap.close();
  }
}

export default function ImageCropTool() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("image");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<AspectPreset>("free");
  const [circle, setCircle] = useState(false);
  const [format, setFormat] = useState<CropFormat>("png");
  const [pixels, setPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  function load(next: File) {
    if (url) URL.revokeObjectURL(url);
    setFile(next);
    setUrl(URL.createObjectURL(next));
    setName(next.name.replace(/\.[^.]+$/, "") || "image");
    setPixels(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  }

  async function save() {
    if (!file || !pixels) return;
    setBusy(true);
    try {
      const result = await exportCrop(file, pixels, circle, format);
      const ext = format === "jpeg" ? "jpg" : format;
      downloadBytes(`${name}.${ext}`, result.bytes, result.mime);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not crop this image.");
    } finally {
      setBusy(false);
    }
  }

  useWorkbenchKeys({ onEnter: () => void save() });

  return (
    <ToolShell
      runsLocally
      busy={busy}
      layout="split"
      tabs={<ToolTabs label="Crop" value="crop" onChange={() => {}} options={[{ value: "crop", label: "Crop" }]} />}
      actions={<InkButton icon={<Crop size={15} />} disabled={!pixels || busy} onClick={() => void save()}>{busy ? "Cropping" : "Download crop"}</InkButton>}
      status={
        <>
          <span className="dot" />
          <span>{pixels ? `${Math.round(pixels.width)}×${Math.round(pixels.height)}` : "Waiting for an image"}</span>
          <span className="ml-auto hidden min-[700px]:inline">Stays in this browser</span>
        </>
      }
      input={
        <Panel title="Frame">
          <Notice tone="neutral" title="Nothing is uploaded." body="Drag the picture inside the frame. A circle keeps a round mask, and JPG fills the corners with white." />
          <Dropzone accept={IMAGE_ACCEPT} label={url ? "Replace the image" : "Drop an image, or click to choose one"} onFile={load} />
          <div className="flex flex-wrap gap-1.5">
            {aspectPresets.map((preset) => (
              <ChipButton key={preset.id} pressed={aspect === preset.id} onClick={() => setAspect(preset.id)}>{preset.label}</ChipButton>
            ))}
          </div>
          <OptionRow label="Circle crop" checked={circle} onChange={setCircle} />
          <FieldRow label="Zoom" htmlFor="crop-zoom">
            <Slider id="crop-zoom" min={1} max={3} step={0.01} value={[zoom]} onValueChange={([value]) => setZoom(value ?? 1)} />
          </FieldRow>
          <Segmented label="Format" value={format} onChange={setFormat} options={formats.map((item) => ({ value: item, label: labels[item] }))} />
        </Panel>
      }
      output={
        <Panel title="Crop">
          {url ? (
            <div className="relative h-80 overflow-hidden rounded-lg bg-sunken">
              <Cropper
                image={url}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio(aspect)}
                cropShape={circle ? "round" : "rect"}
                showGrid={!circle}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_area, next) => setPixels(next)}
              />
            </div>
          ) : (
            <EmptyState art={<Crop size={22} />} title="No image yet" hint="Drop a picture, then drag the frame." />
          )}
        </Panel>
      }
    />
  );
}
