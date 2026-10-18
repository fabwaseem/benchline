"use client";

import { useState } from "react";
import { Eraser } from "lucide-react";
import { ActionButton, ColorInput, OptionRow, Slider, TextInput } from "@/components/kit/controls";
import { downloadBytes } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ProgressMeter } from "@/components/kit/progress-meter";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { fileToBitmap } from "@/lib/client-image";
import { IMAGE_ACCEPT } from "@/lib/image-format";
import { parseHexColor, removeSolidBackground } from "@/tools/background-remover/lib/matte";

type Mode = "portrait" | "solid";

const checker = "bg-[repeating-conic-gradient(var(--muted)_0%_25%,var(--surface)_0%_50%)] bg-[length:16px_16px]";

async function scaledBitmap(file: File, maxEdge: number) {
  const bitmap = await fileToBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("This browser could not read the picture.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas;
}

export default function BackgroundTool() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>("portrait");
  const [tolerance, setTolerance] = useState(42);
  const [color, setColor] = useState("");
  const [picked, setPicked] = useState("#ffffff");
  const [useColor, setUseColor] = useState(false);
  const [preview, setPreview] = useState("");
  const [png, setPng] = useState<Uint8Array | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ label: "Waiting", percent: 0 });
  const [error, setError] = useState("");

  async function runSolid() {
    if (!file) return;
    const canvas = await scaledBitmap(file, 4096);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not read the picture.");
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    const chosen = useColor ? parseHexColor(color || picked) : null;
    if (useColor && !chosen) throw new Error("Use a background color like #ffffff.");
    const matte = removeSolidBackground(new Uint8Array(frame.data), canvas.width, canvas.height, {
      tolerance,
      feather: true,
      color: chosen,
    });
    frame.data.set(matte);
    context.putImageData(frame, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("This browser could not encode PNG.");
    return new Uint8Array(await blob.arrayBuffer());
  }

  async function runPortrait() {
    if (!file) return;
    const canvas = await scaledBitmap(file, 1024);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("This browser could not prepare the portrait.");
    const { removePortraitBackground } = await import("@/tools/background-remover/browser-model");
    const result = await removePortraitBackground(blob, setProgress);
    return new Uint8Array(await result.arrayBuffer());
  }

  async function remove() {
    if (!file) return;
    setBusy(true);
    setError("");
    setProgress({ label: mode === "portrait" ? "Starting the portrait model" : "Clearing the backdrop", percent: 8 });
    try {
      const bytes = mode === "portrait" ? await runPortrait() : await runSolid();
      if (!bytes) return;
      if (preview) URL.revokeObjectURL(preview);
      setPng(bytes);
      setPreview(URL.createObjectURL(new Blob([bytes], { type: "image/png" })));
      setProgress({ label: "Done", percent: 100 });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove the background.");
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (!png) return;
    const stem = (file?.name ?? "image").replace(/\.[^.]+$/, "") || "image";
    downloadBytes(`${stem}.png`, png, "image/png");
  }

  useWorkbenchKeys({ onEnter: () => void remove() });

  return (
    <ToolCard>
      <ToolToolbar
        label="Mode"
        options={[{ value: "portrait", label: "Portrait" }, { value: "solid", label: "Solid color" }]}
        value={mode}
        onChange={setMode}
        actions={
          <>
            <ActionButton className="btn btn-ink" disabled={!file || busy} onClick={() => void remove()}>{busy ? "Working" : "Remove"}</ActionButton>
            {png ? <ActionButton variant="outline" onClick={save}>Download PNG</ActionButton> : null}
          </>
        }
      />
      <ToolPanes ratio="40/60">
        <Pane label="Image">
          <Notice
            tone="neutral"
            title="Nothing is uploaded."
            body="Portrait uses MODNet (Apache-2.0) and shows download progress. It is trained on people. Solid color clears a plain backdrop from the edges without a download."
          />
          <Dropzone accept={IMAGE_ACCEPT} label={file ? file.name : "Drop an image, or click to choose one"} onFile={setFile} />
          {mode === "portrait" ? (
            <p className="text-[12px] text-faint">The long side is limited to 1024 pixels before the model runs. The first run downloads about 7 MB.</p>
          ) : (
            <>
              <FieldRow label="Tolerance" htmlFor="tolerance" help="Higher values treat more of the border color as background.">
                <Slider id="tolerance" min={0} max={120} step={1} value={[tolerance]} onValueChange={([value]) => setTolerance(value ?? 42)} />
              </FieldRow>
              <OptionRow label="Set the backdrop color" checked={useColor} onChange={setUseColor} />
              {useColor ? (
                <div className="flex flex-wrap items-end gap-3">
                  <ColorInput aria-label="Backdrop color" value={picked} onChange={(event) => { setPicked(event.target.value); setColor(event.target.value); }} />
                  <TextInput value={color || picked} onChange={(event) => setColor(event.target.value)} aria-label="Backdrop hex" />
                </div>
              ) : null}
            </>
          )}
          {busy || progress.percent > 0 ? <ProgressMeter label={progress.label} value={progress.percent} /> : null}
        </Pane>
        <Pane label="Cutout">
          {error ? <Notice tone="bad" role="alert" title="Not removed" body={error} /> : null}
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Image with the background removed" className={`max-h-80 w-full rounded-lg border border-border object-contain ${checker}`} />
          ) : (
            <EmptyState art={<Eraser size={22} />} title="No cutout yet" hint="Drop a portrait or a product on a plain backdrop." />
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={error || progress.label}
        tone={error ? "fail" : png ? "pass" : "info"}
        trailing="Stays in this browser"
        items={[{ level: mode === "portrait" ? "info" : "pass", label: mode === "portrait" ? "MODNet" : "Solid color", detail: mode === "portrait" ? "Portrait model" : "Border flood fill" }]}
      />
    </ToolCard>
  );
}
