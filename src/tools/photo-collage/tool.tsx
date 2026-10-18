"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActionButton, ChipButton, ColorInput, Select, Slider } from "@/components/kit/controls";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Pane, StatusStrip, ToolCard, ToolPanes } from "@/components/kit/shell";
import { FileButton } from "@/components/kit/upload/dropzone";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  ASPECTS,
  COLLAGE_LAYOUTS,
  aspectSize,
  clampPan,
  collageFileName,
  coverRect,
  hitCell,
  isHexColor,
  layoutCells,
  layoutCellCount,
  type Cell,
} from "@/tools/photo-collage/lib/collage";

const PREVIEW_W = 720;
const EXPORT_W = 2400;

type Photo = { id: string; url: string; img: HTMLImageElement };

type CollageState = {
  layout: string;
  gap: number;
  background: string;
  photos: Photo[];
  assignments: Array<string | null>;
  selected: number;
  zooms: number[];
  pans: Array<{ x: number; y: number }>;
};

let photoSeq = 0;

export default function PhotoCollageTool() {
  const [layout, setLayout] = useState("quad");
  const [aspectId, setAspectId] = useState("square");
  const [gap, setGap] = useState(8);
  const [background, setBackground] = useState("#111111");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [assignments, setAssignments] = useState<Array<string | null>>([null, null, null, null]);
  const [selected, setSelected] = useState(0);
  const [zooms, setZooms] = useState<number[]>([1, 1, 1, 1]);
  const [pans, setPans] = useState<Array<{ x: number; y: number }>>([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ]);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const aspect = ASPECTS.find((entry) => entry.id === aspectId) ?? ASPECTS[0]!;

  const pickLayout = (id: string) => {
    const count = layoutCellCount(id);
    setLayout(id);
    setSelected(0);
    setAssignments((previous) => Array.from({ length: count }, (_, index) => previous[index] ?? null));
    setZooms((previous) => Array.from({ length: count }, (_, index) => previous[index] ?? 1));
    setPans((previous) =>
      Array.from({ length: count }, (_, index) => previous[index] ?? { x: 0, y: 0 }),
    );
  };

  const addPhotos = useCallback((files: File[]) => {
    setError("");
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        photoSeq += 1;
        setPhotos((previous) => [...previous, { id: `p${photoSeq}`, url, img }]);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        toast.error(`Could not read ${file.name}.`);
      };
      img.src = url;
    });
    toast.success("Photos added");
  }, []);

  const addPhotoToCell = useCallback(
    (file: File) => {
      const index = selected;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        photoSeq += 1;
        const id = `p${photoSeq}`;
        setPhotos((previous) => [...previous, { id, url, img }]);
        setAssignments((previous) => previous.map((value, other) => (other === index ? id : value)));
        toast.success("Photo placed in the selected cell");
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setError("Could not read that image.");
      };
      img.src = url;
    },
    [selected],
  );

  const autoFill = useCallback(() => {
    setAssignments((previous) => previous.map((_, index) => photos[index]?.id ?? previous[index] ?? null));
    toast.success("Cells filled");
  }, [photos]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, state: CollageState) => {
    const scale = width / PREVIEW_W;
    const cells = layoutCells(state.layout, width, height, Math.round(state.gap * scale));
    ctx.fillStyle = isHexColor(state.background) ? state.background : "#111111";
    ctx.fillRect(0, 0, width, height);
    const photoMap = new Map(state.photos.map((photo) => [photo.id, photo]));
    cells.forEach((cell, index) => {
      const photo = state.assignments[index] ? photoMap.get(state.assignments[index]!) : undefined;
      if (!photo || !photo.img.complete || photo.img.naturalWidth === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.07)";
        ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = `${Math.max(12, Math.round(cell.h * 0.12))}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("+", cell.x + cell.w / 2, cell.y + cell.h / 2);
        return;
      }
      const zoom = state.zooms[index] ?? 1;
      const pan = state.pans[index] ?? { x: 0, y: 0 };
      const rect = coverRect(photo.img.naturalWidth, photo.img.naturalHeight, cell, zoom, pan.x * scale, pan.y * scale);
      ctx.save();
      ctx.beginPath();
      ctx.rect(cell.x, cell.y, cell.w, cell.h);
      ctx.clip();
      ctx.drawImage(photo.img, rect.dx, rect.dy, rect.dw, rect.dh);
      ctx.restore();
      if (index === state.selected) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(2, 3 * scale);
        ctx.strokeRect(cell.x + 2, cell.y + 2, cell.w - 4, cell.h - 4);
      }
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = aspectSize(aspect, PREVIEW_W);
    canvas.width = w;
    canvas.height = h;
    draw(ctx, w, h, { layout, gap, background, photos, assignments, selected, zooms, pans });
  });

  const currentCells = () => {
    const { w, h } = aspectSize(aspect, PREVIEW_W);
    return layoutCells(layout, w, h, gap);
  };

  const canvasPos = (event: React.PointerEvent<HTMLCanvasElement>, cells: Cell[]) => {
    const canvas = canvasRef.current;
    if (!canvas || cells.length === 0) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const cells = currentCells();
    const pos = canvasPos(event, cells);
    const index = hitCell(cells, pos.x, pos.y);
    if (index < 0) return;
    setSelected(index);
    if (!assignments[index]) return;
    setDragging(true);
    dragStart.current = {
      x: pos.x,
      y: pos.y,
      panX: pans[index]?.x ?? 0,
      panY: pans[index]?.y ?? 0,
    };
    (event.target as HTMLCanvasElement).setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const cells = currentCells();
    const cell = cells[selected];
    const photo = photos.find((item) => item.id === assignments[selected]);
    if (!cell || !photo) return;
    const pos = canvasPos(event, cells);
    const zoom = zooms[selected] ?? 1;
    const drawn = coverRect(photo.img.naturalWidth, photo.img.naturalHeight, cell, zoom, 0, 0);
    const nextX = clampPan(dragStart.current.panX + (pos.x - dragStart.current.x), drawn.dw, cell.w);
    const nextY = clampPan(dragStart.current.panY + (pos.y - dragStart.current.y), drawn.dh, cell.h);
    setPans((previous) => previous.map((pan, index) => (index === selected ? { x: nextX, y: nextY } : pan)));
  };

  const clearCell = () => {
    setAssignments((previous) => previous.map((value, index) => (index === selected ? null : value)));
  };

  const download = () => {
    const { w, h } = aspectSize(aspect, EXPORT_W);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Could not render the collage.");
      return;
    }
    draw(ctx, w, h, {
      layout,
      gap,
      background,
      photos,
      assignments,
      selected: -1,
      zooms,
      pans,
    });
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error("Could not render the collage.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = collageFileName();
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast.success("Collage downloaded");
    }, "image/png");
  };

  const hasPhotos = photos.length > 0;
  const selectedZoom = zooms[selected] ?? 1;

  return (
    <ToolCard>
      <ToolPanes>
        <Pane label="Layout & photos">
          <FieldRow label="Layout" htmlFor="pc-layout">
            <Select id="pc-layout" value={layout} onChange={(event) => pickLayout(event.target.value)}>
              {COLLAGE_LAYOUTS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} ({option.cells} cells)
                </option>
              ))}
            </Select>
          </FieldRow>
          <div className="grid grid-cols-2 gap-2">
            <FieldRow label="Aspect" htmlFor="pc-aspect">
              <Select id="pc-aspect" value={aspectId} onChange={(event) => setAspectId(event.target.value)}>
                {ASPECTS.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </Select>
            </FieldRow>
            <FieldRow label="Background" htmlFor="pc-bg">
              <ColorInput id="pc-bg" value={background} onChange={(event) => setBackground(event.target.value)} />
            </FieldRow>
          </div>
          <FieldRow label={`Gap ${gap}px`} htmlFor="pc-gap">
            <Slider
              id="pc-gap"
              value={[gap]}
              min={0}
              max={48}
              onValueChange={(value) => setGap(Math.round(value[0] ?? 8))}
            />
          </FieldRow>
          <FieldRow label={`Zoom ${Math.round(selectedZoom * 100)}%`} htmlFor="pc-zoom">
            <Slider
              id="pc-zoom"
              value={[selectedZoom]}
              min={1}
              max={3}
              step={0.05}
              onValueChange={(value) =>
                setZooms((previous) => previous.map((zoom, index) => (index === selected ? (value[0] ?? 1) : zoom)))
              }
            />
          </FieldRow>
          <Dropzone
            accept="image/*"
            multiple
            maxFiles={9}
            label="Drop photos"
            hint="Or click to browse. Stays on this device."
            onFiles={addPhotos}
          />
          {error && <Notice tone="bad" role="alert" title="Something went wrong" body={error} />}
          <div className="flex flex-wrap gap-2">
            <ChipButton onClick={autoFill} disabled={!hasPhotos}>
              Auto-fill cells
            </ChipButton>
            <FileButton accept="image/*" label="Photo for selected cell" onFile={addPhotoToCell} />
            <ChipButton onClick={clearCell}>Clear selected cell</ChipButton>
            {photos.length > 0 && (
              <ChipButton
                onClick={() => {
                  setPhotos([]);
                  setAssignments((previous) => previous.map(() => null));
                }}
              >
                <X className="mr-1 h-3.5 w-3.5" /> Remove all photos
              </ChipButton>
            )}
          </div>
          <div className="text-[12px] text-muted-foreground">
            Click a cell to select it, drag to pan its photo, use the zoom slider. Use “Photo for selected cell” to
            place a photo in the highlighted cell.
          </div>
        </Pane>
        <Pane label="Preview">
          {!hasPhotos ? (
            <EmptyState title="Add photos" hint="Drop up to 9 photos on the left, then arrange your collage." />
          ) : (
            <>
              <canvas
                ref={canvasRef}
                className="w-full cursor-grab rounded-lg border active:cursor-grabbing"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={() => setDragging(false)}
                onPointerLeave={() => setDragging(false)}
              />
              <ActionButton className="btn btn-ink mt-3" onClick={download}>
                Download PNG ({EXPORT_W}px)
              </ActionButton>
            </>
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip>Exports at {EXPORT_W}px wide · drag cells to pan · nothing is uploaded</StatusStrip>
    </ToolCard>
  );
}
