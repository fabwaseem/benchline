"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Eraser, PenLine, Type } from "lucide-react";
import { ActionButton, ChipButton, Slider, TextInput } from "@/components/kit/controls";
import { downloadBytes } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { formatBytes } from "@/lib/image-format";
import {
  inspectSignaturePdf,
  placeSignatures,
  smoothStroke,
  type Point,
  type SignResult,
  type SignaturePlacement,
} from "@/tools/pdf-signature/lib/signature";

const PAD_WIDTH = 640;
const PAD_HEIGHT = 220;

type Doc = {
  name: string;
  bytes: Uint8Array;
  pageCount: number;
  pageWidth: number;
  pageHeight: number;
};

type SigMode = "draw" | "type";

export default function PdfSignatureTool() {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [mode, setMode] = useState<SigMode>("draw");
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [typedName, setTypedName] = useState("");
  const [sigPreview, setSigPreview] = useState("");
  const [page, setPage] = useState(1);
  const [xPct, setXPct] = useState(10);
  const [yPct, setYPct] = useState(80);
  const [wPct, setWPct] = useState(30);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SignResult | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeStroke = useRef<Point[]>([]);
  const drawing = useRef(false);

  const pageCount = doc?.pageCount ?? 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    paintPad(canvas, strokes, mode === "type" ? typedName : "");
    setSigPreview(canvas.toDataURL("image/png"));
  }, [strokes, mode, typedName]);

  async function addFile(file: File) {
    setError("");
    if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError(`${file.name || "That file"} is not a PDF.`);
      return;
    }
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const info = await inspectSignaturePdf(bytes, file.name || "This PDF");
      setDoc({
        name: file.name || "document.pdf",
        bytes,
        pageCount: info.pageCount,
        pageWidth: info.pageWidth,
        pageHeight: info.pageHeight,
      });
      setPage(1);
      setResult(null);
    } catch (caught) {
      setDoc(null);
      setError(caught instanceof Error ? caught.message : "Could not read that PDF.");
    }
  }

  function padPoint(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!canvas) return { x: 0, y: 0 };
    return {
      x: ((event.clientX - rect.left) / rect.width) * PAD_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * PAD_HEIGHT,
    };
  }

  function beginStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    if (mode !== "draw") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    activeStroke.current = [padPoint(event)];
  }

  function extendStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || mode !== "draw") return;
    activeStroke.current = [...activeStroke.current, padPoint(event)];
    const canvas = canvasRef.current;
    if (canvas) {
      paintPad(canvas, [...strokes, activeStroke.current], "");
      setSigPreview(canvas.toDataURL("image/png"));
    }
  }

  function endStroke() {
    if (!drawing.current) return;
    drawing.current = false;
    const stroke = activeStroke.current;
    activeStroke.current = [];
    if (stroke.length >= 2) setStrokes((current) => [...current, stroke]);
  }

  function clearSignature() {
    setStrokes([]);
    setTypedName("");
    setSigPreview("");
  }

  function hasSignature() {
    return mode === "draw"
      ? strokes.some((stroke) => stroke.length >= 2)
      : typedName.trim().length > 0;
  }

  async function sign() {
    setBusy(true);
    setError("");
    try {
      if (!doc) throw new Error("Add a PDF first.");
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("The signature pad is not ready.");
      if (!hasSignature()) throw new Error("Draw or type your signature first.");
      const png = await canvasToPngBytes(canvas);
      const placement: SignaturePlacement = {
        page,
        x: xPct / 100,
        y: yPct / 100,
        width: wPct / 100,
      };
      setResult(await placeSignatures(doc.bytes, png, [placement]));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Could not sign that PDF.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (result) downloadBytes("signed.pdf", result.bytes, "application/pdf");
  }

  useWorkbenchKeys({ onEnter: () => { if (result) download(); else void sign(); } });

  return (
    <ToolCard>
      <ToolToolbar
        actions={<ActionButton className="btn btn-ink" onClick={() => void sign()} disabled={busy || !doc || !hasSignature()}>{busy ? "Signing" : "Sign PDF"}</ActionButton>}
      />
      <ToolPanes ratio="60/40">
        <Pane label="Document and signature">
          <Dropzone accept="application/pdf,.pdf" onFiles={(files) => { const [file] = files; if (file) void addFile(file); }} label="Drop a PDF. It stays in this browser." invalid={Boolean(error)} />
          {doc ? (
            <p className="text-[12.5px] text-muted-foreground">{doc.name} · {doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"}</p>
          ) : null}

          <FieldRow label="Signature" help={mode === "draw" ? "Draw with a mouse, trackpad, or finger." : "Type your name to render it in a script style."}>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <ChipButton pressed={mode === "draw"} onClick={() => setMode("draw")}><PenLine size={14} /> Draw</ChipButton>
                <ChipButton pressed={mode === "type"} onClick={() => setMode("type")}><Type size={14} /> Type</ChipButton>
                <ActionButton variant="ghost" size="sm" onClick={clearSignature}><Eraser size={14} /> Clear</ActionButton>
              </div>
              {mode === "type" ? (
                <TextInput value={typedName} placeholder="Your name" maxLength={60} onChange={(event) => setTypedName(event.target.value)} />
              ) : null}
              <canvas
                ref={canvasRef}
                className="h-[110px] w-full touch-none rounded-lg border border-border bg-surface text-foreground"
                style={{ aspectRatio: `${PAD_WIDTH} / ${PAD_HEIGHT}` }}
                onPointerDown={beginStroke}
                onPointerMove={extendStroke}
                onPointerUp={endStroke}
                onPointerCancel={endStroke}
                aria-label="Signature pad"
              />
            </div>
          </FieldRow>

          <FieldRow label="Page" htmlFor="sig-page" help={`Page 1 to ${pageCount}.`}>
            <TextInput
              id="sig-page"
              type="number"
              min={1}
              max={pageCount}
              value={page}
              disabled={!doc}
              onChange={(event) => {
                const next = Number(event.target.value);
                setPage(Number.isFinite(next) ? Math.min(pageCount, Math.max(1, Math.round(next))) : 1);
              }}
            />
          </FieldRow>
          <FieldRow label="Horizontal position" help="Measured from the left edge, in percent of page width.">
            <Slider value={[xPct]} min={0} max={100} onValueChange={([value]) => setXPct(value ?? 0)} disabled={!doc} />
          </FieldRow>
          <FieldRow label="Vertical position" help="Measured from the top edge, in percent of page height.">
            <Slider value={[yPct]} min={0} max={100} onValueChange={([value]) => setYPct(value ?? 0)} disabled={!doc} />
          </FieldRow>
          <FieldRow label="Signature width" help="In percent of page width. Height follows the signature's shape.">
            <Slider value={[wPct]} min={5} max={100} onValueChange={([value]) => setWPct(value ?? 30)} disabled={!doc} />
          </FieldRow>

          <FieldRow label="Preview" help="Where the signature lands. Preview uses the first page's size.">
            <div
              className="relative w-full overflow-hidden rounded-lg border border-border bg-well"
              style={doc ? { aspectRatio: `${doc.pageWidth} / ${doc.pageHeight}` } : { aspectRatio: "3 / 4" }}
            >
              {sigPreview ? (
                <img
                  src={sigPreview}
                  alt="Signature placement preview"
                  className="absolute"
                  style={{
                    left: `${xPct}%`,
                    top: `${yPct}%`,
                    width: `${wPct}%`,
                    aspectRatio: `${PAD_WIDTH} / ${PAD_HEIGHT}`,
                  }}
                />
              ) : null}
            </div>
          </FieldRow>
        </Pane>
        <Pane label="Signed PDF">
          {error ? <Notice tone="bad" role="alert" title="Could not sign" body={error} /> : null}
          {result ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <ResultStat label="Pages" value={String(result.pageCount)} />
                <ResultStat label="Size" value={formatBytes(result.bytes.byteLength)} />
              </div>
              <ActionButton type="button" onClick={download}><Download size={16} /> Download signed PDF</ActionButton>
            </div>
          ) : <EmptyState title="Nothing signed yet" hint="Add a PDF, make a signature, then sign. The file is built in this browser." />}
          <Notice tone="neutral" title="Nothing is uploaded." body="The PDF and your signature stay in this tab." />
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={error || (busy ? "Signing in this browser" : "Files stay in this browser")}
        tone={error ? "warn" : "pass"}
        trailing="⌘↵ sign"
        items={[{ level: "info", label: "Signature", detail: hasSignature() ? (mode === "draw" ? "Drawn" : "Typed") : "Not made yet" }]}
      />
    </ToolCard>
  );
}

function paintPad(canvas: HTMLCanvasElement, strokes: Point[][], typedName: string) {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.round(PAD_WIDTH * dpr);
  canvas.height = Math.round(PAD_HEIGHT * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, PAD_WIDTH, PAD_HEIGHT);
  const ink = getComputedStyle(canvas).color;
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const stroke of strokes) {
    const smoothed = smoothStroke(stroke);
    if (smoothed.length === 0) continue;
    ctx.beginPath();
    const start = smoothed[0];
    if (!start) continue;
    ctx.moveTo(start.x, start.y);
    for (const point of smoothed.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }
  const name = typedName.trim();
  if (name) {
    ctx.font = 'italic 64px "Brush Script MT", "Segoe Script", cursive';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, PAD_WIDTH / 2, PAD_HEIGHT / 2, PAD_WIDTH - 32);
  }
}

function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not render the signature."));
        return;
      }
      blob.arrayBuffer().then(
        (buffer) => resolve(new Uint8Array(buffer)),
        () => reject(new Error("Could not render the signature.")),
      );
    }, "image/png");
  });
}
