"use client";

import { useState } from "react";
import { FileImage } from "lucide-react";
import { ActionButton, Slider, TextInput } from "@/components/kit/controls";
import { downloadBytes } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { renderPdfInBrowser } from "@/tools/pdf-to-image/lib/browser";
import { imageFormats, type ImageFormat, type RenderedImage } from "@/tools/pdf-to-image/lib/plan";

export default function PdfToImageTool() {
  const [file, setFile] = useState<Uint8Array | null>(null);
  const [name, setName] = useState("document.pdf");
  const [format, setFormat] = useState<ImageFormat>("png");
  const [dpi, setDpi] = useState(96);
  const [range, setRange] = useState("");
  const [quality, setQuality] = useState(82);
  const [images, setImages] = useState<RenderedImage[]>([]);
  const [zip, setZip] = useState<Uint8Array | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  async function add(files: File[]) {
    const picked = files[0];
    if (!picked) return;
    setFile(new Uint8Array(await picked.arrayBuffer()));
    setName(picked.name || "document.pdf");
    setImages([]);
    setZip(null);
    setPreviews([]);
    setError("");
  }

  async function render() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const result = await renderPdfInBrowser(file, { format, dpi, range, quality, stem: name });
      setImages(result.images);
      setZip(result.zip);
      setPreviews(result.images.map((image) => URL.createObjectURL(new Blob([new Uint8Array(image.bytes)], { type: format === "jpeg" ? "image/jpeg" : "image/png" }))));
    } catch (caught) {
      setImages([]);
      setZip(null);
      setPreviews([]);
      setError(caught instanceof Error ? caught.message : "Could not render that PDF.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (images.length === 1 && images[0]) {
      downloadBytes(images[0].name, images[0].bytes, format === "jpeg" ? "image/jpeg" : "image/png");
      return;
    }
    if (zip) downloadBytes(`${name.replace(/\.pdf$/i, "") || "pages"}.zip`, zip, "application/zip");
  }

  useWorkbenchKeys({ onEnter: () => { if (images.length) download(); else void render(); } });

  return (
    <ToolCard>
      <ToolToolbar
        label="Format"
        options={imageFormats.map((item) => ({ value: item, label: item.toUpperCase() }))}
        value={format}
        onChange={(next) => { setFormat(next); setImages([]); setZip(null); setPreviews([]); }}
        actions={
          <ActionButton className="btn btn-ink" disabled={busy || !file} onClick={() => { if (images.length) download(); else void render(); }}>
            {busy ? "Drawing" : images.length ? "Download" : "Render"}
          </ActionButton>
        }
      />
      <ToolPanes ratio="40/60">
        <Pane label="PDF">
          <Dropzone accept="application/pdf,.pdf" onFiles={(files) => void add(files)} label={file ? name : "Drop a PDF. It stays in this browser."} invalid={Boolean(error)} />
          <FieldRow label="Pages" htmlFor="pdf-image-range" help="Blank renders every page, up to 24. Example: 1-3,5">
            <TextInput id="pdf-image-range" value={range} placeholder="all pages" onChange={(event) => { setRange(event.target.value); setImages([]); }} />
          </FieldRow>
          <FieldRow label={`DPI ${dpi}`} htmlFor="pdf-image-dpi" help="72 is screen size. 216 is the highest.">
            <Slider id="pdf-image-dpi" min={72} max={216} step={12} value={[dpi]} onValueChange={(value) => { setDpi(value[0] ?? 96); setImages([]); }} />
          </FieldRow>
          {format === "jpeg" ? (
            <FieldRow label={`Quality ${quality}`} htmlFor="pdf-image-quality">
              <Slider id="pdf-image-quality" min={1} max={100} value={[quality]} onValueChange={(value) => { setQuality(value[0] ?? 82); setImages([]); }} />
            </FieldRow>
          ) : null}
        </Pane>
        <Pane label="Images">
          {error ? <Notice tone="bad" role="alert" title="Could not render" body={error} /> : null}
          {images.length ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
              {previews.map((src, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={images[index]?.name ?? src} src={src} alt={images[index]?.name ?? "Rendered page"} className="w-full rounded-md border border-border bg-well" />
              ))}
            </div>
          ) : (
            <EmptyState art={<FileImage size={22} />} title="No images yet" hint="Add a PDF, then render. One page downloads as an image. Several pages download as a ZIP." />
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={error || (busy ? "Drawing pages in this browser" : file ? "Ready to render" : "The PDF stays in this browser")}
        tone={error ? "fail" : "pass"}
        trailing="⌘↵ render"
        items={[
          { level: "info", label: "Format", detail: format.toUpperCase() },
          { level: "info", label: "Images", detail: images.length ? String(images.length) : "—" },
          { level: images.length > 1 ? "pass" : "info", label: "Download", detail: zip ? "ZIP" : images[0]?.name ?? "—" },
        ]}
      />
    </ToolCard>
  );
}
