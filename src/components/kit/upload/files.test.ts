import { describe, expect, it } from "vitest";
import { matchAccept, parseDroppedUrl, validateFiles } from "@/components/kit/upload/files";

function file(name: string, type: string, size = 10) {
  const blob = new File([new Uint8Array(size)], name, { type });
  return blob;
}

describe("validateFiles", () => {
  it("accepts matching extensions and mime groups", () => {
    const png = file("a.png", "image/png");
    expect(matchAccept(png, ".png,image/*")).toBe(true);
    expect(matchAccept(file("a.gif", "image/gif"), ".png")).toBe(false);
  });

  it("rejects oversized files and extra files", () => {
    const result = validateFiles(
      [file("ok.png", "image/png", 4), file("big.png", "image/png", 20), file("extra.png", "image/png", 4)],
      { accept: "image/png", maxSize: 10, maxFiles: 1 },
    );
    expect(result.accepted.map((item) => item.name)).toEqual(["ok.png"]);
    expect(result.errors.map((item) => item.code)).toEqual(["size", "count"]);
  });

  it("reads an http url and ignores other text", () => {
    expect(parseDroppedUrl("https://example.com/a.png")).toBe("https://example.com/a.png");
    expect(parseDroppedUrl("not a url")).toBeNull();
  });
});
