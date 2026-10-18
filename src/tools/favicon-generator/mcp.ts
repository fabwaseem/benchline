import { z } from "zod";
import { mcpFileSchema, readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { buildFaviconPack } from "@/tools/favicon-generator/lib/build";

export const inputSchema = z.object({
  file: mcpFileSchema.optional().describe("A square-or-any image. Provide file or text."),
  text: z.string().max(8).optional().describe("Up to three letters drawn as the mark. Provide file or text."),
  background: z.string().default("#111111"),
  color: z.string().default("#ffffff"),
  name: z.string().max(40).default("App"),
}).superRefine((value, ctx) => {
  const hasFile = Boolean(value.file?.url?.trim() || value.file?.data?.trim());
  const hasText = Boolean(value.text?.trim());
  if (hasFile === hasText) {
    ctx.addIssue({ code: "custom", message: "Provide file or text, not both." });
  }
});

export const outputSchema = z.object({
  filename: z.string(),
  mime: z.string(),
  bytes: z.number().int(),
  data: z.string().describe("ZIP of the favicon files as base64."),
  html: z.string(),
  nextMetadata: z.string(),
  manifest: z.string(),
  preview: z.string().describe("32 pixel PNG as base64."),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const file = parsed.file ? await readMcpBytes(parsed.file, "Image") : null;
  const pack = await buildFaviconPack({
    bytes: file?.bytes,
    text: parsed.text,
    background: parsed.background,
    color: parsed.color,
    name: parsed.name,
  });
  return outputSchema.parse(pack);
}

export const tool: BenchTool = {
  slug: "favicon-generator",
  name: "generate_favicon",
  title: "Generate a favicon pack",
  description: "Build a favicon pack from an image or up to three letters. The ZIP contains favicon.ico, PNG sizes, a web manifest, an HTML snippet, and a Next.js metadata snippet. Letters are drawn with a built-in bitmap font so the result does not depend on a system font. Send base64 or a public URL. Private addresses are refused and the decoded file is capped at 10 MB.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
