"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActionButton, OptionRow, Select, Slider, TextInput } from "@/components/kit/controls";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { toast } from "sonner";
import {
  bottomCaptionY,
  captionDragBounds,
  captionFontPx,
  clampOffset,
  MEME_STYLES,
  memeFileName,
  memeStyle,
  normalizeCaption,
  splitCaptionLines,
  topCaptionY,
} from "@/tools/meme-generator/lib/meme";

const CANVAS_WIDTH = 900;

type Source = { kind: "style"; styleId: string } | { kind: "upload"; url: string; width: number; height: number };

function drawMeme(
  ctx: CanvasRenderingContext2D,
  source: Source,
  top: string,
  bottom: string,
  upper: boolean,
  fontScale: number,
  topOffset: number,
  bottomOffset: number,
) {
  const width = CANVAS_WIDTH;
  const height =
    source.kind === "upload" ? Math.round((CANVAS_WIDTH * source.height) / source.width) : CANVAS_WIDTH;
  ctx.clearRect(0, 0, width, height);
  if (source.kind === "style") {
    const style = memeStyle(source.styleId);
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, style.from);
    gradient.addColorStop(1, style.to);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  const fontPx = captionFontPx(width, fontScale);
  ctx.font = `900 ${fontPx}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.lineJoin = "round";
  const pad = width * 0.04;
  const maxWidth = width - pad * 2;

  const drawBlock = (text: string, y: number) => {
    const lines = splitCaptionLines(normalizeCaption(text, upper));
    const lineHeight = fontPx * 1.15;
    lines.forEach((line, index) => {
      const lineY = y + index * lineHeight;
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = Math.max(2, fontPx / 16);
      ctx.strokeText(line, width / 2, lineY, maxWidth);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(line, width / 2, lineY, maxWidth);
    });
    return lines.length * lineHeight;
  };

  const topY = topCaptionY(height, topOffset);
  drawBlock(top, topY);
  const bottomLines = splitCaptionLines(normalizeCaption(bottom, upper)).length;
  const bottomBlock = bottomLines * fontPx * 1.15;
  drawBlock(bottom, bottomCaptionY(height, bottomBlock, bottomOffset));
  return height;
}

export default function MemeGeneratorTool() {
  const [source, setSource] = useState<Source>({ kind: "style", styleId: "sunset" });
  const [mode, setMode] = useState<"style" | "upload">("style");
  const [top, setTop] = useState("TOP TEXT");
  const [bottom, setBottom] = useState("BOTTOM TEXT");
  const [upper, setUpper] = useState(true);
  const [fontScale, setFontScale] = useState(1);
  const [topOffset, setTopOffset] = useState(0);
  const [bottomOffset, setBottomOffset] = useState(0);
  const [dragging, setDragging] = useState<"top" | "bottom" | null>(null);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const heightRef = useRef(CANVAS_WIDTH);

  const handleFile = useCallback((file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("That file is not an image.");
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setSource({ kind: "upload", url, width: image.naturalWidth, height: image.naturalHeight });
      setTopOffset(0);
      setBottomOffset(0);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Could not read that image.");
    };
    image.src = url;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const render = () => {
      if (source.kind === "upload") {
        const image = imageRef.current;
        if (!image || !image.complete || image.naturalWidth === 0) return;
        const height = Math.round((CANVAS_WIDTH * image.naturalHeight) / image.naturalWidth);
        canvas.width = CANVAS_WIDTH;
        canvas.height = height;
        heightRef.current = height;
        ctx.drawImage(image, 0, 0, CANVAS_WIDTH, height);
      } else {
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_WIDTH;
        heightRef.current = CANVAS_WIDTH;
      }
      drawMeme(ctx, source, top, bottom, upper, fontScale, topOffset, bottomOffset);
    };
    if (source.kind === "upload" && document.fonts) {
      void document.fonts.ready.then(render);
    } else {
      render();
    }
  }, [source, top, bottom, upper, fontScale, topOffset, bottomOffset]);

  const canvasY = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    return ((event.clientY - rect.top) / rect.height) * canvas.height;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const y = canvasY(event);
    const height = heightRef.current;
    const fontPx = captionFontPx(CANVAS_WIDTH, fontScale);
    const topBlock = splitCaptionLines(normalizeCaption(top, upper)).length * fontPx * 1.15;
    const bottomBlock = splitCaptionLines(normalizeCaption(bottom, upper)).length * fontPx * 1.15;
    const topY = topCaptionY(height, topOffset);
    const bottomY = bottomCaptionY(height, bottomBlock, bottomOffset);
    if (y < topY + topBlock + 20) setDragging("top");
    else if (y > bottomY - 20) setDragging("bottom");
    (event.target as HTMLCanvasElement).setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const height = heightRef.current;
    const fontPx = captionFontPx(CANVAS_WIDTH, fontScale);
    const block = splitCaptionLines(normalizeCaption(dragging === "top" ? top : bottom, upper)).length * fontPx * 1.15;
    const bounds = captionDragBounds(height, block);
    const base = dragging === "top" ? topCaptionY(height, 0) : bottomCaptionY(height, block, 0);
    const next = clampOffset(canvasY(event) - base - (dragging === "top" ? 0 : block), bounds.min, bounds.max);
    if (dragging === "top") setTopOffset(next);
    else setBottomOffset(next);
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error("Could not render the meme.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = memeFileName();
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast.success("Meme downloaded");
    }, "image/png");
  };

  useWorkbenchKeys({
    onCopy: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.toBlob((blob) => {
        if (!blob) return;
        void navigator.clipboard
          .write([new ClipboardItem({ "image/png": blob })])
          .then(() => toast.success("Copied image"))
          .catch(() => toast.error("Copy failed in this browser."));
      }, "image/png");
    },
  });

  return (
    <ToolCard>
      <ToolToolbar
        label="Background"
        options={[
          { value: "style", label: "Styles" },
          { value: "upload", label: "Upload" },
        ]}
        value={mode}
        onChange={setMode}
        actions={
          <ActionButton className="btn btn-ink" onClick={download}>
            Download PNG
          </ActionButton>
        }
      />
      <ToolPanes>
        <Pane label="Captions & style">
          <FieldRow label="Top caption" htmlFor="meme-top">
            <TextInput id="meme-top" value={top} onChange={(event) => setTop(event.target.value)} />
          </FieldRow>
          <FieldRow label="Bottom caption" htmlFor="meme-bottom">
            <TextInput id="meme-bottom" value={bottom} onChange={(event) => setBottom(event.target.value)} />
          </FieldRow>
          <OptionRow label="ALL CAPS captions" checked={upper} onChange={setUpper} />
          <FieldRow label={`Text size ${Math.round(fontScale * 100)}%`} htmlFor="meme-size">
            <Slider
              id="meme-size"
              value={[fontScale]}
              min={0.5}
              max={1.5}
              step={0.05}
              onValueChange={(value) => setFontScale(value[0] ?? 1)}
            />
          </FieldRow>
          {mode === "style" ? (
            <FieldRow label="Style" htmlFor="meme-style">
              <Select
                id="meme-style"
                value={source.kind === "style" ? source.styleId : "sunset"}
                onChange={(event) => setSource({ kind: "style", styleId: event.target.value })}
              >
                {MEME_STYLES.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.name}
                  </option>
                ))}
              </Select>
            </FieldRow>
          ) : (
            <Dropzone
              accept="image/*"
              label="Drop an image"
              hint="Or click to browse. Stays on this device."
              onFile={handleFile}
            />
          )}
          {error && <Notice tone="bad" role="alert" title="Something went wrong" body={error} />}
          <div className="text-[12px] text-muted-foreground">
            Drag a caption on the preview to nudge it up or down. Ctrl/⌘+C copies the image.
          </div>
        </Pane>
        <Pane label="Preview">
          {mode === "upload" && source.kind !== "upload" ? (
            <EmptyState title="Add an image" hint="Drop an image on the left to start your meme." />
          ) : (
            <canvas
              ref={canvasRef}
              className="w-full cursor-grab rounded-lg border active:cursor-grabbing"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={() => setDragging(null)}
              onPointerLeave={() => setDragging(null)}
            />
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip>Renders at {CANVAS_WIDTH}px wide · PNG download · nothing is uploaded</StatusStrip>
    </ToolCard>
  );
}
