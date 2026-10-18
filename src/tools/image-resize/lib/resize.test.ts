import { describe, expect, it } from "vitest";
import { MAX_EDGE, parseDimension, placement, planResize } from "@/tools/image-resize/lib/resize";

describe("image resize", () => {
  it("scales by percent and clamps the range", () => {
    expect(planResize({ sourceWidth: 1000, sourceHeight: 800, mode: "percent", width: null, height: null, percent: 50, lockAspect: true })).toEqual({ width: 500, height: 400 });
    expect(planResize({ sourceWidth: 100, sourceHeight: 100, mode: "percent", width: null, height: null, percent: 0, lockAspect: true }).width).toBe(1);
    expect(planResize({ sourceWidth: 100, sourceHeight: 50, mode: "percent", width: null, height: null, percent: 900, lockAspect: true })).toEqual({ width: 400, height: 200 });
  });

  it("locks one side to the source ratio and treats an empty side as the source size", () => {
    expect(planResize({ sourceWidth: 1000, sourceHeight: 500, mode: "pixels", width: 200, height: null, percent: 100, lockAspect: true })).toEqual({ width: 200, height: 100 });
    expect(planResize({ sourceWidth: 1000, sourceHeight: 500, mode: "pixels", width: null, height: 100, percent: 100, lockAspect: true })).toEqual({ width: 200, height: 100 });
    expect(planResize({ sourceWidth: 1000, sourceHeight: 500, mode: "pixels", width: 200, height: null, percent: 100, lockAspect: false })).toEqual({ width: 200, height: 500 });
    expect(planResize({ sourceWidth: 1000, sourceHeight: 500, mode: "pixels", width: 300, height: 100, percent: 100, lockAspect: false })).toEqual({ width: 300, height: 100 });
  });

  it("keeps an explicit frame and caps huge edges", () => {
    expect(planResize({ sourceWidth: 4000, sourceHeight: 3000, mode: "pixels", width: 1080, height: 1080, percent: 100, lockAspect: true })).toEqual({ width: 1080, height: 1080 });
    expect(planResize({ sourceWidth: 100, sourceHeight: 100, mode: "pixels", width: 20_000, height: null, percent: 100, lockAspect: true }).width).toBe(MAX_EDGE);
    expect(parseDimension("")).toBeNull();
    expect(parseDimension("0")).toBeNull();
    expect(parseDimension("1280.4")).toBe(1280);
  });

  it("places contain, cover, and stretch frames", () => {
    const contain = placement(200, 100, 100, 100, "contain");
    expect(contain.dw).toBe(100);
    expect(contain.dh).toBe(50);
    expect(contain.dx).toBe(0);
    expect(contain.dy).toBe(25);
    const cover = placement(200, 100, 100, 100, "cover");
    expect(cover.sx).toBe(50);
    expect(cover.sy).toBe(0);
    expect(cover.sw).toBe(100);
    expect(cover.sh).toBe(100);
    expect(cover.dw).toBe(100);
    expect(placement(200, 100, 100, 40, "stretch")).toEqual({ sx: 0, sy: 0, sw: 200, sh: 100, dx: 0, dy: 0, dw: 100, dh: 40 });
  });
});
