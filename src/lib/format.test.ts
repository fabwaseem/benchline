import { describe, expect, it } from "vitest";
import { assertByteSize, MAX_FILE_BYTES } from "@/lib/format";

describe("assertByteSize", () => {
  it("rejects empty and oversized files", () => {
    expect(() => assertByteSize(new Uint8Array(), "Notes")).toThrow(/empty/);
    expect(() => assertByteSize(new Uint8Array(MAX_FILE_BYTES + 1), "Notes")).toThrow(/40 MB/);
    expect(() => assertByteSize(new Uint8Array([1]), "Notes")).not.toThrow();
  });
});
