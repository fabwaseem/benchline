"use client";

import { useRef, useState } from "react";
import { ActionButton, TextInput } from "@/components/kit/controls";
import { Download } from "lucide-react";
import { FileList } from "@/components/kit/file-list";
import { downloadBytes } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { formatBytes } from "@/lib/image-format";
import { inspectPdf, mergePdfs, type MergeResult } from "@/tools/pdf-merge/lib/merge";

type Item = {
  id: string;
  name: string;
  bytes: Uint8Array;
  pages: string;
  pageCount: number;
};

export default function PdfMergeTool() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<MergeResult | null>(null);
  const drag = useRef<number | null>(null);

  async function addFiles(files: File[]) {
    const problems: string[] = [];
    const next: Item[] = [];
    for (const file of files) {
      if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        problems.push(`${file.name} is not a PDF.`);
        continue;
      }
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const info = await inspectPdf(bytes, file.name || "This PDF");
        next.push({ id: crypto.randomUUID(), name: file.name || "document.pdf", bytes, pages: "", pageCount: info.pageCount });
      } catch (caught) {
        problems.push(caught instanceof Error ? caught.message : "Could not read that PDF.");
      }
    }
    if (next.length) setResult(null);
    setItems((current) => [...current, ...next].slice(0, 25));
    setError(problems[0] ?? "");
  }

  async function merge() {
    setBusy(true);
    setError("");
    try {
      setResult(await mergePdfs(items.map((item) => ({ name: item.name, data: item.bytes, pages: item.pages }))));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Could not merge those PDFs.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (result) downloadBytes("merged.pdf", result.bytes, "application/pdf");
  }

  useWorkbenchKeys({ onEnter: () => { if (result) download(); else void merge(); } });

  const pageTotal = items.reduce((sum, item) => sum + item.pageCount, 0);

  return (
    <ToolCard>
      <ToolToolbar
        actions={<ActionButton className="btn btn-ink" onClick={() => void merge()} disabled={busy || items.length < 2}>{busy ? "Merging" : "Merge"}</ActionButton>}
      />
      <ToolPanes ratio="60/40">
        <Pane label="PDFs">
          <Dropzone accept="application/pdf,.pdf" multiple onFiles={(files) => void addFiles(files)} label="Drop PDFs. They stay in this browser." invalid={Boolean(error)} />
          {items.length === 0 ? <EmptyState title="No PDFs yet" hint="Add at least two. The list order is the page order." /> : (
            <FileList
              label="PDFs to merge"
              items={items.map((item, index) => ({
                id: item.id,
                name: item.name,
                meta: `${item.pageCount} ${item.pageCount === 1 ? "page" : "pages"} · ${formatBytes(item.bytes.byteLength)}`,
                upDisabled: index === 0,
                downDisabled: index === items.length - 1,
                onUp: () => { setItems((current) => moveItem(current, index, index - 1)); setResult(null); },
                onDown: () => { setItems((current) => moveItem(current, index, index + 1)); setResult(null); },
                onRemove: () => { setItems((current) => current.filter((row) => row.id !== item.id)); setResult(null); },
                onDragStart: () => { drag.current = index; },
                onDragOver: (event) => event.preventDefault(),
                onDrop: (event) => {
                  event.preventDefault();
                  const from = drag.current;
                  drag.current = null;
                  if (from == null) return;
                  setItems((current) => moveItem(current, from, index));
                  setResult(null);
                },
                extra: (
                  <FieldRow label="Pages" htmlFor={`pages-${item.id}`} help="Blank keeps every page. Example: 1-3,5">
                    <TextInput id={`pages-${item.id}`} value={item.pages} placeholder="all pages" onChange={(event) => {
                      const pages = event.target.value;
                      setItems((current) => current.map((row) => row.id === item.id ? { ...row, pages } : row));
                      setResult(null);
                    }} />
                  </FieldRow>
                ),
              }))}
            />
          )}
        </Pane>
        <Pane label="Merged PDF">
          {error ? <Notice tone="bad" role="alert" title="Could not merge" body={error} /> : null}
          {result ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <ResultStat label="Pages" value={String(result.pageCount)} />
                <ResultStat label="Size" value={formatBytes(result.bytes.byteLength)} />
              </div>
              <ActionButton type="button" onClick={download}><Download />Download PDF</ActionButton>
            </div>
          ) : <EmptyState title="Nothing merged yet" hint="Add two PDFs, then merge. The file is built in this browser." />}
          <Notice tone="neutral" title="Nothing is uploaded." body="Page ranges and the merged file stay in this tab." />
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={error || (busy ? "Merging in this browser" : "Files stay in this browser")}
        tone={error ? "warn" : "pass"}
        trailing="⌘↵ merge"
        items={[{ level: "info", label: "Files", detail: items.length ? `${items.length} files · ${pageTotal} pages` : "Waiting for PDFs" }]}
      />
    </ToolCard>
  );
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (from === to || to < 0 || to >= items.length) return items;
  const next = items.slice();
  const [item] = next.splice(from, 1);
  if (!item) return items;
  next.splice(to, 0, item);
  return next;
}
