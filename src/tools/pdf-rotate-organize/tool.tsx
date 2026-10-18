"use client";

import { useRef, useState } from "react";
import { RotateCw, Trash2 } from "lucide-react";
import { ActionButton, IconButton } from "@/components/kit/controls";
import { downloadBytes } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { Notice } from "@/components/kit/notice";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { openBrowserPdf } from "@/lib/pdf-browser";
import { inspectPdf, nextTurn, organizePdf, type QuarterTurn } from "@/tools/pdf-rotate-organize/lib/organize";

type Card = {
  id: string;
  source: number;
  rotate: QuarterTurn;
  thumb: string;
};

export default function PdfRotateTool() {
  const [file, setFile] = useState<Uint8Array | null>(null);
  const [name, setName] = useState("document.pdf");
  const [cards, setCards] = useState<Card[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const drag = useRef<number | null>(null);

  async function add(files: File[]) {
    const picked = files[0];
    if (!picked) return;
    setBusy(true);
    setError("");
    try {
      const bytes = new Uint8Array(await picked.arrayBuffer());
      const info = await inspectPdf(bytes, picked.name || "This PDF");
      setFile(bytes);
      setName(picked.name || "document.pdf");
      setCards(Array.from({ length: info.pageCount }, (_, index) => ({
        id: crypto.randomUUID(),
        source: index + 1,
        rotate: 0,
        thumb: "",
      })));
      void loadThumbs(bytes, info.pageCount);
    } catch (caught) {
      setFile(null);
      setCards([]);
      setError(caught instanceof Error ? caught.message : "Could not read that PDF.");
    } finally {
      setBusy(false);
    }
  }

  async function loadThumbs(bytes: Uint8Array, count: number) {
    try {
      const pdf = await openBrowserPdf(bytes);
      const thumbs: string[] = [];
      try {
        const limit = Math.min(count, 80);
        for (let page = 1; page <= limit; page += 1) {
          const sheet = await pdf.getPage(page);
          const viewport = sheet.getViewport({ scale: 0.22 });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const context = canvas.getContext("2d");
          if (!context) break;
          context.fillStyle = "white";
          context.fillRect(0, 0, canvas.width, canvas.height);
          await sheet.render({ canvas, canvasContext: context, viewport }).promise;
          thumbs.push(canvas.toDataURL("image/jpeg", 0.72));
        }
      } finally {
        await pdf.destroy();
      }
      setCards((current) => current.map((card) => ({ ...card, thumb: thumbs[card.source - 1] ?? card.thumb })));
    } catch {
      setError((current) => current || "");
    }
  }

  async function save() {
    if (!file || cards.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const result = await organizePdf(file, cards.map((card) => ({ source: card.source, rotate: card.rotate })));
      const stem = name.replace(/\.pdf$/i, "") || "document";
      downloadBytes(`${stem}-organized.pdf`, result.bytes, "application/pdf");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not organize that PDF.");
    } finally {
      setBusy(false);
    }
  }

  function move(from: number, to: number) {
    setCards((current) => {
      if (from === to || to < 0 || to >= current.length) return current;
      const next = current.slice();
      const [item] = next.splice(from, 1);
      if (!item) return current;
      next.splice(to, 0, item);
      return next;
    });
  }

  useWorkbenchKeys({ onEnter: () => void save() });

  return (
    <ToolCard>
      <ToolToolbar
        actions={<ActionButton className="btn btn-ink" disabled={busy || cards.length === 0} onClick={() => void save()}>{busy ? "Working" : "Download"}</ActionButton>}
      />
      <ToolPanes ratio="35/65">
        <Pane label="PDF">
          <Dropzone accept="application/pdf,.pdf" onFiles={(files) => void add(files)} label="Drop a PDF. It stays in this browser." invalid={Boolean(error)} />
          <div className="flex flex-wrap gap-2">
            <ActionButton type="button" variant="outline" disabled={cards.length === 0} onClick={() => setCards((current) => current.map((card) => ({ ...card, rotate: nextTurn(card.rotate) })))}>
              <RotateCw />Rotate all
            </ActionButton>
            <ActionButton type="button" variant="outline" disabled={!file} onClick={() => setCards((current) => [...current].sort((left, right) => left.source - right.source).map((card) => ({ ...card, rotate: 0 })))}>
              Reset order
            </ActionButton>
          </div>
          <Notice tone="neutral" title="Nothing is uploaded." body="Drag a card to move it. Turn or delete a single page from the card." />
        </Pane>
        <Pane label="Page order">
          {error ? <Notice tone="bad" role="alert" title="Could not organize" body={error} /> : null}
          {cards.length === 0 ? (
            <EmptyState art={<RotateCw size={22} />} title="No pages yet" hint="Drop a PDF. Each page becomes a card you can turn or drop." />
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2" aria-label="Pages">
              {cards.map((card, index) => (
                <li
                  key={card.id}
                  draggable
                  onDragStart={() => { drag.current = index; }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const from = drag.current;
                    drag.current = null;
                    if (from == null) return;
                    move(from, index);
                  }}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-2"
                >
                  <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-md bg-well">
                    {card.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={card.thumb} alt="" className="max-h-full max-w-full" style={{ transform: `rotate(${card.rotate}deg)` }} />
                    ) : (
                      <span className="font-mono text-lg tabular-nums" style={{ transform: `rotate(${card.rotate}deg)` }}>{card.source}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[12px] text-muted-foreground">Page {card.source} · {card.rotate}°</span>
                    <span className="flex">
                      <IconButton label={`Rotate page ${card.source}`} onClick={() => setCards((current) => current.map((item) => item.id === card.id ? { ...item, rotate: nextTurn(item.rotate) } : item))}>
                        <RotateCw size={14} />
                      </IconButton>
                      <IconButton label={`Remove page ${card.source}`} onClick={() => setCards((current) => current.filter((item) => item.id !== card.id))}>
                        <Trash2 size={14} />
                      </IconButton>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={error || (busy ? "Working in this browser" : `${cards.length} ${cards.length === 1 ? "page" : "pages"} in the new file`)}
        tone={error ? "fail" : "pass"}
        trailing="⌘↵ download"
        items={[{ level: "info", label: "Order", detail: cards.length ? cards.map((card) => card.source).join(", ") : "Waiting for a PDF" }]}
      />
    </ToolCard>
  );
}
