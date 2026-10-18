import { z } from "zod";
import { decodeBase64, encodeBase64 } from "@/lib/base64";
import type { BenchTool } from "@/lib/mcp/types";
import { SERVER_UNZIP_BYTES, unzipEntries, zipEntries } from "@/tools/zip-tools/lib/zip";

export const inputSchema = z.object({
  mode: z.enum(["zip", "unzip"]).default("zip"),
  files: z
    .array(
      z.object({
        name: z.string().min(1).max(256),
        data: z.string().describe("Base64 file bytes."),
      }),
    )
    .max(200)
    .optional()
    .describe("Files to zip (zip mode)."),
  archive: z
    .object({
      data: z.string().describe("Base64 ZIP bytes."),
      name: z.string().optional(),
    })
    .optional()
    .describe("Archive to extract (unzip mode)."),
});

export const outputSchema = z.object({
  mode: z.enum(["zip", "unzip"]),
  zip: z.string().optional().describe("Base64 ZIP bytes (zip mode)."),
  files: z
    .array(
      z.object({
        name: z.string(),
        bytes: z.number().int(),
        data: z.string().describe("Base64 file bytes."),
      }),
    )
    .optional()
    .describe("Extracted files (unzip mode)."),
  fileCount: z.number().int(),
  totalBytes: z.number().int(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  if (parsed.mode === "zip") {
    const files = parsed.files ?? [];
    if (files.length === 0) throw new Error("Provide files to zip.");
    const entries = files.map((file) => ({ name: file.name, data: decodeBase64(file.data, file.name) }));
    const zipped = zipEntries(entries);
    return outputSchema.parse({
      mode: "zip",
      zip: encodeBase64(zipped),
      fileCount: entries.length,
      totalBytes: zipped.byteLength,
    });
  }
  if (!parsed.archive) throw new Error("Provide an archive to unzip.");
  const entries = unzipEntries(decodeBase64(parsed.archive.data, parsed.archive.name ?? "archive"), {
    maxBytes: SERVER_UNZIP_BYTES,
  });
  const total = entries.reduce((sum, entry) => sum + entry.data.byteLength, 0);
  return outputSchema.parse({
    mode: "unzip",
    files: entries.map((entry) => ({
      name: entry.name,
      bytes: entry.data.byteLength,
      data: encodeBase64(entry.data),
    })),
    fileCount: entries.length,
    totalBytes: total,
  });
}

export const tool: BenchTool = {
  slug: "zip-tools",
  name: "zip_files",
  title: "Zip files or unzip an archive",
  description:
    "Create a ZIP archive from files or list and extract the contents of a ZIP archive. Everything is handled in memory; no files are stored.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
