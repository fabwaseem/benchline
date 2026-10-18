import { z } from "zod";
import { LANGUAGES, minifyCode, type Language } from "@/tools/code-minifier/lib/minify";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  language: z.enum(LANGUAGES),
  code: z.string().min(1).max(500_000),
  jsMangle: z.boolean().default(true),
  jsCompress: z.boolean().default(true),
  cssLevel: z.union([z.literal(1), z.literal(2)]).default(2),
  htmlAggressive: z.boolean().default(false),
});

export const outputSchema = z.object({
  code: z.string(),
  beforeBytes: z.number().int(),
  afterBytes: z.number().int(),
  savedBytes: z.number().int(),
  savedPct: z.number(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const result = await minifyCode(parsed.language as Language, parsed.code, {
    jsMangle: parsed.jsMangle,
    jsCompress: parsed.jsCompress,
    cssLevel: parsed.cssLevel,
    htmlAggressive: parsed.htmlAggressive,
  });
  if (result.error) throw new Error(result.error);
  return outputSchema.parse({
    code: result.code,
    beforeBytes: result.beforeBytes,
    afterBytes: result.afterBytes,
    savedBytes: result.savedBytes,
    savedPct: result.savedPct,
  });
}

export const tool: BenchTool = {
  slug: "code-minifier",
  name: "minify_code",
  title: "Minify JavaScript, CSS, or HTML",
  description:
    "Minify source code with Terser (JS), csso (CSS), or a structural HTML pass and report before/after byte counts.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
