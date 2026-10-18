import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { uniqueNames, zipNamed } from "@/lib/zip-files";

describe("zip files", () => {
  it("keeps the first name and suffixes copies", () => {
    expect(uniqueNames(["a.jpg", "a.jpg", "note"])).toEqual(["a.jpg", "a-2.jpg", "note"]);
    expect(uniqueNames(["archive.tar.jpg", "archive.tar.jpg"])).toEqual(["archive.tar.jpg", "archive.tar-2.jpg"]);
  });

  it("stores the bytes in a zip", () => {
    const zipped = zipNamed([
      { name: "a.jpg", data: new Uint8Array([1, 2, 3]) },
      { name: "a.jpg", data: new Uint8Array([4, 5]) },
    ]);
    expect(zipped[0]).toBe(0x50);
    expect(zipped[1]).toBe(0x4b);
    const opened = unzipSync(zipped);
    expect(opened["a.jpg"]).toEqual(new Uint8Array([1, 2, 3]));
    expect(opened["a-2.jpg"]).toEqual(new Uint8Array([4, 5]));
  });
});
