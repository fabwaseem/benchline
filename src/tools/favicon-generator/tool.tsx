"use client";

import { useState } from "react";
import { AppWindow } from "lucide-react";
import { toast } from "sonner";
import { ColorInput, TextInput } from "@/components/kit/controls";
import { CodeOutput } from "@/components/kit/code-output";
import { downloadBytes } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { fileToBitmap } from "@/lib/client-image";
import { IMAGE_ACCEPT } from "@/lib/image-format";
import { zipBlob } from "@/lib/zip-files";
import { encodeIco, faviconPngs, htmlSnippet, icoSizes, manifestJson, nextMetadataSnippet, safeName } from "@/tools/favicon-generator/lib/pack";

type Source = "letters" | "image";

async function canvasPng(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("This browser could not encode PNG.");
  return new Uint8Array(await blob.arrayBuffer());
}

function paintMark(canvas: HTMLCanvasElement, text: string, background: string, color: string) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not draw the mark.");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const mark = [...text].slice(0, 3).join("") || "A";
  context.fillStyle = color;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `700 ${mark.length > 1 ? 180 : 280}px sans-serif`;
  context.fillText(mark, canvas.width / 2, canvas.height / 2 + 8);
}

export default function FaviconTool() {
  const [source, setSource] = useState<Source>("letters");
  const [text, setText] = useState("B");
  const [name, setName] = useState("App");
  const [background, setBackground] = useState("#111111");
  const [color, setColor] = useState("#ffffff");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);

  async function masterCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not draw the icon.");
    if (source === "image" && file) {
      const bitmap = await fileToBitmap(file);
      try {
        const scale = Math.max(canvas.width / bitmap.width, canvas.height / bitmap.height);
        const width = bitmap.width * scale;
        const height = bitmap.height * scale;
        context.drawImage(bitmap, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      } finally {
        bitmap.close();
      }
      return canvas;
    }
    paintMark(canvas, text, background, color);
    return canvas;
  }

  async function build() {
    setBusy(true);
    try {
      const master = await masterCanvas();
      const pngs = await Promise.all(faviconPngs.map(async (item) => {
        const canvas = document.createElement("canvas");
        canvas.width = item.size;
        canvas.height = item.size;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("This browser could not scale the icon.");
        context.drawImage(master, 0, 0, item.size, item.size);
        return { ...item, data: await canvasPng(canvas) };
      }));
      const ico = encodeIco(icoSizes.map((size) => {
        const png = pngs.find((item) => item.size === size);
        if (!png) throw new Error("Missing favicon size.");
        return { size, png: png.data };
      }));
      const app = safeName(name);
      const manifest = manifestJson(app);
      const html = htmlSnippet();
      const next = nextMetadataSnippet();
      const zip = zipBlob([
        { name: "favicon.ico", data: ico },
        ...pngs.map((item) => ({ name: item.name, data: item.data })),
        { name: "site.webmanifest", data: new TextEncoder().encode(manifest) },
        { name: "snippet.html", data: new TextEncoder().encode(html) },
        { name: "next-metadata.ts", data: new TextEncoder().encode(next) },
      ]);
      const thumb = pngs.find((item) => item.size === 32);
      if (thumb) {
        if (preview) URL.revokeObjectURL(preview);
        setPreview(URL.createObjectURL(new Blob([thumb.data], { type: "image/png" })));
      }
      downloadBytes("favicon-pack.zip", new Uint8Array(await zip.arrayBuffer()));
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not build the favicon pack.");
    } finally {
      setBusy(false);
    }
  }

  useWorkbenchKeys({ onEnter: () => void build() });

  return (
    <ToolShell
      runsLocally
      busy={busy}
      layout="split"
      tabs={<ToolTabs label="Source" value={source} onChange={setSource} options={[{ value: "letters", label: "Letters" }, { value: "image", label: "Image" }]} />}
      actions={<InkButton icon={<AppWindow size={15} />} disabled={busy || (source === "image" && !file)} onClick={() => void build()}>{busy ? "Building" : "Download ZIP"}</InkButton>}
      status={
        <>
          <span className="dot" />
          <span>{source === "image" ? file?.name ?? "Waiting for an image" : safeName(text || "A")}</span>
          <span className="ml-auto hidden min-[700px]:inline">Built in this browser</span>
        </>
      }
      input={
        <Panel title="Mark">
          <Notice tone="neutral" title="Nothing is uploaded." body="The ZIP includes favicon.ico, the PNG sizes, a manifest, and the tags to paste into a page." />
          {source === "image" ? (
            <Dropzone accept={IMAGE_ACCEPT} label={file ? file.name : "Drop an image, or click to choose one"} onFile={setFile} />
          ) : (
            <>
              <FieldRow label="Letters" htmlFor="mark" help="Up to three characters. Emoji use this browser's font.">
                <TextInput id="mark" value={text} maxLength={8} onChange={(event) => setText(event.target.value)} />
              </FieldRow>
              <div className="flex flex-wrap items-end gap-3">
                <FieldRow label="Tile" htmlFor="tile"><ColorInput id="tile" value={background} onChange={(event) => setBackground(event.target.value)} /></FieldRow>
                <FieldRow label="Ink" htmlFor="ink"><ColorInput id="ink" value={color} onChange={(event) => setColor(event.target.value)} /></FieldRow>
              </div>
            </>
          )}
          <FieldRow label="App name" htmlFor="app-name" help="Written into the web manifest.">
            <TextInput id="app-name" value={name} onChange={(event) => setName(event.target.value)} />
          </FieldRow>
        </Panel>
      }
      output={
        <Panel title="Pack">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="32 pixel favicon preview" className="size-16 rounded-lg border border-border bg-background" />
          ) : (
            <EmptyState art={<AppWindow size={22} />} title="No pack yet" hint="Download the ZIP to preview the 32 pixel icon and copy the snippets." />
          )}
          <CodeOutput code={htmlSnippet()} filename="snippet.html" label="HTML" />
          <CodeOutput code={nextMetadataSnippet()} filename="next-metadata.ts" label="Next.js" />
          <CodeOutput code={manifestJson(name)} filename="site.webmanifest" label="Manifest" />
        </Panel>
      }
    />
  );
}
