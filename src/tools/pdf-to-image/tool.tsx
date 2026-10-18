"use client";

import { useState } from "react";
import { Download, FileImage } from "lucide-react";
import { FieldRow } from "@/components/kit/field-row";
import { Segmented } from "@/components/kit/segmented";
import { Slider, TextInput } from "@/components/kit/controls";
import { downloadBytes } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
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
    <ToolShell
      runsLocally
      busy={busy}
      layout="split"
      tabs={<ToolTabs label="Format" value={format} onChange={setFormat} options={imageFormats.map((item) => ({ value: item, label: item.toUpperCase() }))} />}
      actions={<InkButton icon={<Download size={15} />} disabled={busy || !file} onClick={() => { if (images.length) download(); else void render(); }}>{images.length ? "Download" : "Render"}</InkButton>}
      status={
        <>
          <span className={error ? "dot dot-warn" : "dot"} />
          <span>{error || (busy ? "Drawing pages in this browser" : file ? "Ready to render" : "The PDF stays in this browser")}</span>
          <span className="ml-auto hidden min-[700px]:inline">⌘↵ render</span>
        </>
      }
      input={
        <Panel title="PDF">
          <Dropzone accept="application/pdf,.pdf" onFiles={(files) => void add(files)} label={file ? name : "Drop a PDF. It stays in this browser."} invalid={Boolean(error)} />
          <Segmented label="Image format" value={format} onChange={setFormat} options={imageFormats.map((item) => ({ value: item, label: item.toUpperCase() }))} />
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
        </Panel>
      }
      output={
        <Panel title="Images">
          {error ? <Notice tone="bad" role="alert" title="Could not render" body={error} /> : null}
          {images.length ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <ResultStat label="Images" value={String(images.length)} />
                <ResultStat label="Download" value={zip ? "ZIP" : images[0]?.name ?? "Image"} />
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
                {previews.map((src, index) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={images[index]?.name ?? src} src={src} alt={images[index]?.name ?? "Rendered page"} className="w-full rounded-md border border-border bg-well" />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState art={<FileImage size={22} />} title="No images yet" hint="Add a PDF, then render. One page downloads as an image. Several pages download as a ZIP." />
          )}
        </Panel>
      }
    />
  );
}
