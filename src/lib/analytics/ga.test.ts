import { afterEach, describe, expect, it, vi } from "vitest";
import { gaBootstrap, gaEvent, gaScriptSrc, parseGaId } from "@/lib/analytics/ga";

describe("parseGaId", () => {
  it("accepts a GA4 measurement id", () => {
    expect(parseGaId("G-ABC123XYZ9")).toBe("G-ABC123XYZ9");
    expect(parseGaId(" g-abc123xyz9 ")).toBe("G-ABC123XYZ9");
  });

  it("turns the tag off for empty or malformed values", () => {
    expect(parseGaId(undefined)).toBeNull();
    expect(parseGaId("")).toBeNull();
    expect(parseGaId("UA-12345-1")).toBeNull();
    expect(parseGaId("G-abc');alert(1);//")).toBeNull();
  });
});

describe("gaBootstrap", () => {
  it("queues the config call for the id", () => {
    const code = gaBootstrap("G-ABC123XYZ9");
    expect(code).toContain("window.dataLayer=window.dataLayer||[]");
    expect(code).toContain(`gtag('config',"G-ABC123XYZ9")`);
  });
});

describe("gaScriptSrc", () => {
  it("points at googletagmanager", () => {
    expect(gaScriptSrc("G-ABC123XYZ9")).toBe("https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ9");
  });
});

describe("gaEvent", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does nothing without gtag", () => {
    vi.stubGlobal("window", {});
    expect(() => gaEvent("tool_used", { tool_slug: "x" })).not.toThrow();
  });

  it("forwards to gtag and swallows its errors", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });
    gaEvent("tool_used", { tool_slug: "json-formatter" });
    expect(gtag).toHaveBeenCalledWith("event", "tool_used", { tool_slug: "json-formatter" });
    vi.stubGlobal("window", {
      gtag: () => {
        throw new Error("blocked");
      },
    });
    expect(() => gaEvent("tool_used")).not.toThrow();
  });
});
