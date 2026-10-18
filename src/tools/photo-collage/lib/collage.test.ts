import { describe, expect, it } from "vitest";
import {
  aspectSize,
  clampPan,
  collageFileName,
  coverRect,
  hitCell,
  isHexColor,
  layoutCellCount,
  layoutCells,
} from "./collage";

describe("layoutCells", () => {
  it("builds a 2x2 quad", () => {
    const cells = layoutCells("quad", 1000, 1000, 10);
    expect(cells).toHaveLength(4);
    expect(cells[0]).toEqual({ x: 0, y: 0, w: 495, h: 495 });
    expect(cells[3]).toEqual({ x: 505, y: 505, w: 495, h: 495 });
  });

  it("builds a focus layout", () => {
    const cells = layoutCells("focus", 1000, 800, 20);
    expect(cells).toHaveLength(3);
    expect(cells[0]?.h).toBe(800);
    expect((cells[1]?.y ?? 0) + (cells[1]?.h ?? 0) + 20).toBe(cells[2]?.y);
  });

  it("clamps the gap and falls back", () => {
    const cells = layoutCells("nope", 1000, 1000, 9999);
    expect(cells).toHaveLength(4);
  });

  it("counts cells", () => {
    expect(layoutCellCount("nine")).toBe(9);
    expect(layoutCellCount("nope")).toBe(4);
  });
});

describe("coverRect", () => {
  it("cover-fits a wide image in a square cell", () => {
    const rect = coverRect(200, 100, { x: 0, y: 0, w: 100, h: 100 }, 1, 0, 0);
    expect(rect.dw).toBe(200);
    expect(rect.dh).toBe(100);
    expect(rect.dx).toBe(-50);
    expect(rect.dy).toBe(0);
  });

  it("applies zoom and pan", () => {
    const rect = coverRect(100, 100, { x: 0, y: 0, w: 100, h: 100 }, 2, 10, -5);
    expect(rect.dw).toBe(200);
    expect(rect.dx).toBe(-40);
    expect(rect.dy).toBe(-55);
  });
});

describe("helpers", () => {
  it("clamps pan", () => {
    expect(clampPan(999, 200, 100)).toBe(50);
    expect(clampPan(-999, 200, 100)).toBe(-50);
    expect(clampPan(10, 100, 100)).toBe(0);
  });

  it("hit-tests cells topmost-first", () => {
    const cells = [
      { x: 0, y: 0, w: 100, h: 100 },
      { x: 50, y: 50, w: 100, h: 100 },
    ];
    expect(hitCell(cells, 75, 75)).toBe(1);
    expect(hitCell(cells, 10, 10)).toBe(0);
    expect(hitCell(cells, 500, 500)).toBe(-1);
  });

  it("computes aspect sizes", () => {
    expect(aspectSize({ id: "wide", name: "16:9", w: 16, h: 9 }, 1600)).toEqual({ w: 1600, h: 900 });
  });

  it("validates hex colors", () => {
    expect(isHexColor("#1a2b3c")).toBe(true);
    expect(isHexColor("#ABCDEF")).toBe(true);
    expect(isHexColor("#abc")).toBe(false);
    expect(isHexColor("red")).toBe(false);
  });

  it("builds a file name", () => {
    expect(collageFileName(new Date("2024-01-01T00:00:00Z"))).toMatch(/^collage-[a-z0-9]+\.png$/);
  });
});
