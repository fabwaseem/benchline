import { z } from "zod";
import { caseStyles, convertAllCases } from "@/tools/case-converter/lib/case";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  text: z.string().max(100_000).describe("Text to convert. Each line is converted on its own."),
  style: z.enum(caseStyles).optional().describe("Return one style. Omit it to return every style."),
});

export const outputSchema = z.object({
  cases: z.array(z.object({
    style: z.string(),
    label: z.string(),
    text: z.string(),
  })),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const cases = convertAllCases(parsed.text).filter((item) => !parsed.style || item.style === parsed.style);
  return outputSchema.parse({ cases });
}

export const tool: BenchTool = {
  slug: "case-converter",
  name: "convert_case",
  title: "Convert text case",
  description: "Convert text to camelCase, snake_case, kebab-case, CONSTANT_CASE, and AP or Chicago title case. Returns every style unless one is requested.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
