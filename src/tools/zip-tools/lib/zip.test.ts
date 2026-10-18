import { describe, expect, it } from "vitest";
import { strFromU8, zipSync } from "fflate";
import {
  ArchiveTooLargeError,
  SERVER_UNZIP_BYTES,
  formatBytes,
  isZipName,
  sanitizeEntryName,
  textEntry,
  unzipEntries,
  zipEntries,
  zipFileName,
} from "./zip";

describe("sanitizeEntryName", () => {
  it("cleans names", () => {
    expect(sanitizeEntryName("docs/a.txt")).toBe("docs/a.txt");
    expect(sanitizeEntryName("C:\\docs\\a.txt")).toBe("C:/docs/a.txt");
    expect(sanitizeEntryName("/abs/path.txt")).toBe("abs/path.txt");
  });

  it("rejects traversal", () => {
    expect(sanitizeEntryName("../evil.txt")).toBeNull();
    expect(sanitizeEntryName("a/../../evil.txt")).toBeNull();
    expect(sanitizeEntryName("")).toBeNull();
    expect(sanitizeEntryName("   ")).toBeNull();
  });
});

describe("zip round trip", () => {
  it("zips and unzips", () => {
    const zipped = zipEntries([textEntry("hello.txt", "hello"), textEntry("dir/world.txt", "world")]);
    expect(zipped.byteLength).toBeGreaterThan(0);
    const entries = unzipEntries(zipped);
    expect(entries.map((entry) => entry.name).sort()).toEqual(["dir/world.txt", "hello.txt"]);
    const hello = entries.find((entry) => entry.name === "hello.txt");
    expect(strFromU8(hello?.data ?? new Uint8Array())).toBe("hello");
  });

  it("rejects empty and duplicate input", () => {
    expect(() => zipEntries([])).toThrow("at least one file");
    expect(() => zipEntries([textEntry("a.txt", "x"), textEntry("a.txt", "y")])).toThrow("Duplicate");
  });

  it("rejects invalid archives", () => {
    expect(() => unzipEntries(new Uint8Array([1, 2, 3]))).toThrow("not a valid ZIP");
  });

  it("rejects a small archive whose declared size is over the server cap", () => {
    const archive = zipSync({ "zeros.bin": new Uint8Array(SERVER_UNZIP_BYTES + 1) }, { level: 9 });
    expect(archive.byteLength).toBeLessThan(64 * 1024);
    expect(() => unzipEntries(archive, { maxBytes: SERVER_UNZIP_BYTES })).toThrow(ArchiveTooLargeError);
    expect(() => unzipEntries(archive, { maxBytes: SERVER_UNZIP_BYTES })).toThrow(/archive too large/i);
  });
});

describe("helpers", () => {
  it("formats bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("detects zip names", () => {
    expect(isZipName("a.ZIP")).toBe(true);
    expect(isZipName("a.txt")).toBe(false);
  });

  it("builds a file name", () => {
    expect(zipFileName(new Date("2024-05-01T00:00:00Z"))).toBe("archive-2024-05-01.zip");
  });
});
