import { describe, expect, it } from "vitest";
import { originAllowed } from "@/lib/mcp/origin";

describe("originAllowed", () => {
  it("accepts both public hosts on Host and Origin", () => {
    for (const host of ["tools.fabwaseem.com", "tools.fabwaseem.com:443", "benchline.fabwaseem.com"]) {
      expect(originAllowed(host, "https://tools.fabwaseem.com")).toBe(true);
      expect(originAllowed(host, "https://benchline.fabwaseem.com")).toBe(true);
    }
    expect(originAllowed("Tools.Fabwaseem.com:443", null)).toBe(true);
    expect(originAllowed("benchline.fabwaseem.com", null)).toBe(true);
  });

  it("still allows localhost and rejects a foreign origin", () => {
    expect(originAllowed("benchline.fabwaseem.com", "http://localhost:3000")).toBe(true);
    expect(originAllowed("127.0.0.1:3000", "http://127.0.0.1:3000")).toBe(true);
    expect(originAllowed("benchline.fabwaseem.com", "https://evil.example")).toBe(false);
    expect(originAllowed("evil.example:8443", "https://evil.example")).toBe(false);
    expect(originAllowed("tools.fabwaseem.com", "https://tools.fabwaseem.com.evil.example")).toBe(false);
    expect(originAllowed("benchline.fabwaseem.com", "http://tools.fabwaseem.com")).toBe(false);
    expect(originAllowed("benchline.fabwaseem.com", "not a url")).toBe(false);
  });
});
