"use client";

import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, Download, FileImage, X } from "lucide-react";
import { downloadBytes } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/image-format";
import { imagesToPdf, type Orientation, type PageSizeName } from "@/tools/image-to-pdf/lib/images";

type Item = {
  id: string;
  name: string;
  bytes: Uint8Array;
  kind: "jpg" | "png";
  preview: string;
};

const margins = [
  { value: "0", label: "None" },
  { value: "18", label: "Narrow" },
  { value: "36", label: "Normal" },
  { value: "72", label: "Wide" },
] as const;

export default function ImageToPdfTool() {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState<PageSizeName>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [margin, setMargin] = useState<(typeof margins)[number]["value"]>("18");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const drag = useRef<number | null>(null);

  async function addFiles(files: File[]) {
    const problems: string[] = [];
    const next: Item[] = [];
    for (const file of files) {
      try {
        const prepared = await prepareImage(file);
        next.push({ id: crypto.randomUUID(), name: file.name || "image", ...prepared, preview: URL.createObjectURL(file) });
      } catch (caught) {
        problems.push(caught instanceof Error ? caught.message : "Could not read that image.");
      }
    }
    if (next.length) setResult(null);
    setItems((current) => [...current, ...next].slice(0, 40));
    setError(problems[0] ?? "");
  }

  function remove(id: string) {
    setItems((current) => {
      const item = current.find((row) => row.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return current.filter((row) => row.id !== id);
    });
    setResult(null);
  }

  async function build() {
    setBusy(true);
    setError("");
    try {
      const pdf = await imagesToPdf(items.map((item) => ({ data: item.bytes, kind: item.kind })), {
        page,
        orientation,
        margin: Number(margin),
      });
      setResult(pdf.bytes);
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Could not build the PDF.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (result) downloadBytes("images.pdf", result, "application/pdf");
  }

  useWorkbenchKeys({ onEnter: () => { if (result) download(); else void build(); } });

  return (
    <ToolShell
      runsLocally
      busy={busy}
      layout="split+inspector"
      flow="band"
      columns="min-[1280px]:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_300px]"
      tabs={<ToolTabs label="Mode" value="images" onChange={() => undefined} options={[{ value: "images", label: "Images" }]} />}
      actions={<InkButton icon={<FileImage size={15} />} onClick={() => void build()} disabled={busy || items.length === 0}>Create PDF</InkButton>}
      status={
        <>
          <span className={error ? "dot dot-warn" : "dot"} />
          <span>{error || (busy ? "Building the PDF in this browser" : "Images stay in this browser")}</span>
          <span className="ml-auto hidden min-[700px]:inline">⌘↵ create</span>
        </>
      }
      input={
        <Panel title="Images">
          <Dropzone accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple onFiles={(files) => void addFiles(files)} label="Drop JPG, PNG, or WebP. They stay in this browser." invalid={Boolean(error)} />
          {items.length === 0 ? <EmptyState title="No images yet" hint="The list order becomes the page order." /> : (
            <ul className="flex flex-col gap-2" aria-label="Images">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  draggable
                  onDragStart={() => { drag.current = index; }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const from = drag.current;
                    drag.current = null;
                    if (from == null) return;
                    setItems((current) => moveItem(current, from, index));
                    setResult(null);
                  }}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background p-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.preview} alt="" className="size-10 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{item.name}</div>
                    <div className="font-mono text-[12px] text-muted-foreground">{item.kind.toUpperCase()} · {formatBytes(item.bytes.byteLength)}</div>
                  </div>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move ${item.name} up`} disabled={index === 0} onClick={() => { setItems((current) => moveItem(current, index, index - 1)); setResult(null); }}><ChevronUp /></Button>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move ${item.name} down`} disabled={index === items.length - 1} onClick={() => { setItems((current) => moveItem(current, index, index + 1)); setResult(null); }}><ChevronDown /></Button>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${item.name}`} onClick={() => remove(item.id)}><X /></Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      }
      output={
        <Panel title="PDF">
          {error ? <Notice tone="bad" role="alert" title="Could not build the PDF" body={error} /> : null}
          {result ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <ResultStat label="Pages" value={String(items.length)} />
                <ResultStat label="Size" value={formatBytes(result.byteLength)} />
              </div>
              <Button type="button" onClick={download}><Download />Download PDF</Button>
            </div>
          ) : <EmptyState title="No PDF yet" hint="WebP is converted in this browser, then embedded with the JPG and PNG files." />}
        </Panel>
      }
      inspector={
        <Panel title="Page">
          <FieldRow label="Size" htmlFor="page">
            <Segmented label="Page size" value={page} onChange={(value) => { setPage(value); setResult(null); }} options={[
              { value: "a4", label: "A4" },
              { value: "letter", label: "Letter" },
              { value: "fit", label: "Fit" },
            ]} />
          </FieldRow>
          <FieldRow label="Orientation" htmlFor="orientation" help="Auto uses landscape when the image is wider than it is tall.">
            <Segmented label="Orientation" value={orientation} onChange={(value) => { setOrientation(value); setResult(null); }} options={[
              { value: "auto", label: "Auto" },
              { value: "portrait", label: "Portrait" },
              { value: "landscape", label: "Landscape" },
            ]} />
          </FieldRow>
          <FieldRow label="Margin" htmlFor="margin">
            <Segmented label="Margin" value={margin} onChange={(value) => { setMargin(value); setResult(null); }} options={[...margins]} />
          </FieldRow>
          <Notice tone="neutral" title="Nothing is uploaded." body="Each image becomes one page, in list order." />
        </Panel>
      }
    />
  );
}

async function prepareImage(file: File): Promise<{ bytes: Uint8Array; kind: "jpg" | "png" }> {
  const name = file.name.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (file.type === "image/jpeg" || name.endsWith(".jpg") || name.endsWith(".jpeg")) return { bytes, kind: "jpg" };
  if (file.type === "image/png" || name.endsWith(".png")) return { bytes, kind: "png" };
  if (file.type === "image/webp" || name.endsWith(".webp")) return { bytes: await webpToPng(file), kind: "png" };
  throw new Error(`${file.name} is not a JPG, PNG, or WebP image.`);
}

async function webpToPng(file: File) {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error(`${file.name} could not be read.`);
    context.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error(`${file.name} could not be converted.`);
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    bitmap.close();
  }
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (from === to || to < 0 || to >= items.length) return items;
  const next = items.slice();
  const [item] = next.splice(from, 1);
  if (!item) return items;
  next.splice(to, 0, item);
  return next;
}
