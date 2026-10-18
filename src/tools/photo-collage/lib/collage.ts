export type Cell = { x: number; y: number; w: number; h: number };

export type AspectPreset = { id: string; name: string; w: number; h: number };

export const ASPECTS: AspectPreset[] = [
  { id: "square", name: "1:1", w: 1, h: 1 },
  { id: "wide", name: "16:9", w: 16, h: 9 },
  { id: "photo", name: "4:3", w: 4, h: 3 },
  { id: "story", name: "9:16", w: 9, h: 16 },
];

function gridCells(width: number, height: number, gap: number, cols: number, rows: number): Cell[] {
  const cellW = (width - gap * (cols - 1)) / cols;
  const cellH = (height - gap * (rows - 1)) / rows;
  const cells: Cell[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      cells.push({
        x: Math.round(col * (cellW + gap)),
        y: Math.round(row * (cellH + gap)),
        w: Math.round(cellW),
        h: Math.round(cellH),
      });
    }
  }
  return cells;
}

function focusCells(width: number, height: number, gap: number): Cell[] {
  const leftW = Math.round((width - gap) / 2);
  const rightH = Math.round((height - gap) / 2);
  return [
    { x: 0, y: 0, w: leftW, h: height },
    { x: leftW + gap, y: 0, w: width - leftW - gap, h: rightH },
    { x: leftW + gap, y: rightH + gap, w: width - leftW - gap, h: height - rightH - gap },
  ];
}

export type CollageLayout = { id: string; name: string; cells: number };

export const COLLAGE_LAYOUTS: CollageLayout[] = [
  { id: "duo", name: "Duo", cells: 2 },
  { id: "duo-stack", name: "Duo stacked", cells: 2 },
  { id: "trio", name: "Trio", cells: 3 },
  { id: "focus", name: "Focus", cells: 3 },
  { id: "quad", name: "Quad", cells: 4 },
  { id: "six", name: "Six", cells: 6 },
  { id: "nine", name: "Nine", cells: 9 },
];

export function layoutCells(layoutId: string, width: number, height: number, gap: number): Cell[] {
  const safeGap = Math.max(0, Math.min(gap, Math.min(width, height) / 4));
  switch (layoutId) {
    case "duo":
      return gridCells(width, height, safeGap, 2, 1);
    case "duo-stack":
      return gridCells(width, height, safeGap, 1, 2);
    case "trio":
      return gridCells(width, height, safeGap, 3, 1);
    case "focus":
      return focusCells(width, height, safeGap);
    case "quad":
      return gridCells(width, height, safeGap, 2, 2);
    case "six":
      return gridCells(width, height, safeGap, 3, 2);
    case "nine":
      return gridCells(width, height, safeGap, 3, 3);
    default:
      return gridCells(width, height, safeGap, 2, 2);
  }
}

export function layoutCellCount(layoutId: string): number {
  return COLLAGE_LAYOUTS.find((layout) => layout.id === layoutId)?.cells ?? 4;
}

/** Cover-fit draw rect for an image inside a cell, with zoom and pan offsets. */
export function coverRect(
  imgW: number,
  imgH: number,
  cell: Cell,
  zoom: number,
  panX: number,
  panY: number,
): { dx: number; dy: number; dw: number; dh: number } {
  const scale = Math.max(cell.w / imgW, cell.h / imgH) * zoom;
  const dw = imgW * scale;
  const dh = imgH * scale;
  return {
    dx: cell.x + (cell.w - dw) / 2 + panX,
    dy: cell.y + (cell.h - dh) / 2 + panY,
    dw,
    dh,
  };
}

export function clampPan(pan: number, drawn: number, cell: number): number {
  const overflow = Math.max(0, (drawn - cell) / 2);
  return Math.min(overflow, Math.max(-overflow, pan));
}

export function hitCell(cells: Cell[], x: number, y: number): number {
  for (let index = cells.length - 1; index >= 0; index -= 1) {
    const cell = cells[index];
    if (cell && x >= cell.x && x <= cell.x + cell.w && y >= cell.y && y <= cell.y + cell.h) return index;
  }
  return -1;
}

export function aspectSize(preset: AspectPreset, width: number): { w: number; h: number } {
  return { w: width, h: Math.round((width * preset.h) / preset.w) };
}

export function collageFileName(when: Date = new Date()): string {
  return `collage-${when.getTime().toString(36)}.png`;
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
