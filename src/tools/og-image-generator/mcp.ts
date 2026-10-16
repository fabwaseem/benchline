import { z } from "zod";
import { buildMetaTags, buildOpenGraphFile, ogExample, templates } from "@/tools/og-image-generator/lib/og";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  template: z.enum(templates).default("blog"),
  title: z.string().min(1),
  subtitle: z.string().default(""),
  author: z.string().default(""),
  background: z.string().default(ogExample.background),
  foreground: z.string().default(ogExample.foreground),
  accent: z.string().default(ogExample.accent),
  font: z.enum(["sans", "mono"]).default("sans"),
  imageUrl: z.string().default("https://example.com/opengraph-image"),
});

export const outputSchema = z.object({
  metaTags: z.string(),
  source: z.string(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const { imageUrl, ...card } = parsed;
  return outputSchema.parse({
    metaTags: buildMetaTags(card, imageUrl),
    source: buildOpenGraphFile(card),
  });
}

export const tool: BenchTool = {
  slug: "og-image-generator",
  name: "build_open_graph",
  title: "Build Open Graph tags",
  description: "Build the meta tags and a Next.js opengraph-image.tsx source file for a 1200 by 630 card. Use this when a page needs share tags, not when you only need to inspect a live URL.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
