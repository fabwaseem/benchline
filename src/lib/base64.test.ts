import { describe, expect, it } from "vitest";
import { decodeBase64, encodeBase64 } from "@/lib/base64";

describe("base64", () => {
  it("round-trips bytes and accepts a data URI", () => {
    const bytes = new Uint8Array([0, 255, 16, 32]);
    expect(decodeBase64(encodeBase64(bytes), "File")).toEqual(bytes);
    expect(decodeBase64(`data:application/pdf;base64,${encodeBase64(bytes)}`, "File")).toEqual(bytes);
  });

  it("rejects blank and invalid input", () => {
    expect(() => decodeBase64("   ", "File")).toThrow(/empty/);
    expect(() => decodeBase64("!!!!", "File")).toThrow(/base64/);
  });
});
