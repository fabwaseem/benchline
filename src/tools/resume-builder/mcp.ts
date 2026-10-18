import { z } from "zod";
import { PDFDocument } from "pdf-lib";
import { encodeBase64 } from "@/lib/base64";
import type { BenchTool } from "@/lib/mcp/types";
import { renderResumePdf, resumeSchema, type ResumeTemplate } from "@/tools/resume-builder/lib/resume";

export const inputSchema = z.object({
  resume: resumeSchema,
  template: z.enum(["clean", "modern", "compact"]).default("clean"),
});

export const outputSchema = z.object({
  data: z.string().describe("Resume PDF as base64."),
  pageCount: z.number().int(),
  bytes: z.number().int(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const template: ResumeTemplate = parsed.template;
  const bytes = await renderResumePdf(parsed.resume, template);
  const doc = await PDFDocument.load(bytes);
  return outputSchema.parse({
    data: encodeBase64(bytes),
    pageCount: doc.getPageCount(),
    bytes: bytes.byteLength,
  });
}

export const tool: BenchTool = {
  slug: "resume-builder",
  name: "generate_resume",
  title: "Generate a resume PDF",
  description: "Build a resume PDF from profile, experience, education, and skills. A name plus at least one experience, education, or skills entry is required. Choose the clean, modern, or compact template. Returns the A4 PDF as base64.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
