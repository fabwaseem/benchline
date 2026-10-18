import { z } from "zod";
import { calculatePercent, percentModes } from "@/tools/percentage-calculator/lib/percent";
import type { BenchTool } from "@/lib/mcp/types";

const amount = z.union([z.string(), z.number()]);

export const inputSchema = z.object({
  mode: z.enum(percentModes).default("of").describe("of, is, change, reverse, increase, decrease, or margin."),
  a: amount.describe("First value. For of and increase, this is the percent."),
  b: amount.describe("Second value. For of and increase, this is the amount."),
});

export const outputSchema = z.object({
  result: z.string(),
  unit: z.enum(["number", "percent"]),
  formula: z.string(),
  parts: z.array(z.object({ label: z.string(), value: z.string() })),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const result = calculatePercent(parsed.mode, textOf(parsed.a), textOf(parsed.b));
  if ("error" in result) throw new Error(result.error);
  return outputSchema.parse(result);
}

function textOf(value: string | number) {
  return typeof value === "number" ? String(value) : value;
}

export const tool: BenchTool = {
  slug: "percentage-calculator",
  name: "calculate_percentage",
  title: "Calculate a percentage",
  description: "Calculate percent of a value, what percent one number is of another, percent change, the reverse, an increase or decrease, and margin versus markup.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
