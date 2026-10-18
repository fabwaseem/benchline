import { z } from "zod";
import { convertUnits, unitCategories } from "@/tools/unit-converter/lib/units";
import type { BenchTool } from "@/lib/mcp/types";

const categoryIds = unitCategories.map((category) => category.id) as [(typeof unitCategories)[number]["id"], ...(typeof unitCategories)[number]["id"][]];

export const inputSchema = z.object({
  category: z.enum(categoryIds),
  from: z.string().describe("Source unit id, such as m, C, MB, or MiB."),
  to: z.string().describe("Target unit id from the same category."),
  value: z.union([z.string(), z.number()]),
  precision: z.number().int().min(0).max(12).default(6),
});

export const outputSchema = z.object({
  result: z.string(),
  rows: z.array(z.object({
    id: z.string(),
    label: z.string(),
    value: z.string(),
  })),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const value = typeof parsed.value === "number" ? String(parsed.value) : parsed.value;
  const result = convertUnits(parsed.category, parsed.from, parsed.to, value, parsed.precision);
  if ("error" in result) throw new Error(result.error);
  return outputSchema.parse(result);
}

export const tool: BenchTool = {
  slug: "unit-converter",
  name: "convert_units",
  title: "Convert units",
  description: "Convert length, mass, volume, temperature, area, speed, time, and data size. Decimal bytes (kB, MB) and binary bytes (KiB, MiB) are separate categories.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
