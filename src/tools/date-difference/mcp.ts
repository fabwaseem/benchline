import { z } from "zod";
import { difference } from "@/tools/date-difference/lib/diff";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  startDate: z.string().describe("Start date as YYYY-MM-DD."),
  endDate: z.string().describe("End date as YYYY-MM-DD."),
  startTime: z.string().optional().describe("Start time as HH:MM or HH:MM:SS. Defaults to midnight."),
  endTime: z.string().optional().describe("End time as HH:MM or HH:MM:SS. Defaults to midnight."),
  includeEnd: z.boolean().default(false).describe("Count the end date as well as the days between."),
  holidays: z.string().default("").describe("Weekday holidays to exclude from business days, one YYYY-MM-DD per line."),
});

export const outputSchema = z.object({
  sign: z.number().int(),
  years: z.number().int(),
  months: z.number().int(),
  days: z.number().int(),
  totalDays: z.number().int(),
  countedDays: z.number().int(),
  weeks: z.number().int(),
  extraDays: z.number().int(),
  hours: z.number().int(),
  minutes: z.number().int(),
  seconds: z.number().int(),
  totalHours: z.string(),
  businessDays: z.number().int(),
  weekendDays: z.number().int(),
  holidayDays: z.number().int(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const result = difference(parsed);
  if ("error" in result) throw new Error(result.error);
  return outputSchema.parse(result);
}

export const tool: BenchTool = {
  slug: "date-difference",
  name: "date_difference",
  title: "Difference between two dates",
  description: "Count calendar days, elapsed time, and business days between two dates. Business days skip weekends and any YYYY-MM-DD holidays you list.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
