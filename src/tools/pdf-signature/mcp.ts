import { z } from "zod";
import { encodeBase64 } from "@/lib/base64";
import { mcpFileSchema, pdfFileSchema, readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { placeSignatures } from "@/tools/pdf-signature/lib/signature";

export const inputSchema = z.object({
  file: pdfFileSchema.describe("The PDF to sign."),
  signature: mcpFileSchema.describe("The signature as a PNG image, base64 or a public URL."),
  placements: z
    .array(
      z.object({
        page: z.number().int().min(1).describe("1-based page number."),
        x: z.number().min(0).max(1).describe("Horizontal position from the left, as a fraction of page width."),
        y: z.number().min(0).max(1).describe("Vertical position from the top, as a fraction of page height."),
        width: z.number().min(0.05).max(1).describe("Signature width, as a fraction of page width."),
      }),
    )
    .min(1)
    .max(20),
});

export const outputSchema = z.object({
  data: z.string().describe("Signed PDF as base64."),
  pageCount: z.number().int(),
  bytes: z.number().int(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const [pdf, signature] = await Promise.all([
    readMcpBytes(parsed.file, parsed.file.name || "PDF"),
    readMcpBytes(parsed.signature, "Signature"),
  ]);
  const result = await placeSignatures(pdf.bytes, signature.bytes, parsed.placements);
  return outputSchema.parse({
    data: encodeBase64(result.bytes),
    pageCount: result.pageCount,
    bytes: result.bytes.byteLength,
  });
}

export const tool: BenchTool = {
  slug: "pdf-signature",
  name: "sign_pdf",
  title: "Sign a PDF with a PNG signature",
  description:
    "Stamp a PNG signature image onto one or more PDF pages at given positions (fractions of the page, x and y measured from the top-left, width as a fraction of page width). The signature keeps its aspect ratio. Returns the signed PDF as base64.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
