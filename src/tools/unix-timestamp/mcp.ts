import { z } from "zod";
import { convertToDate, convertToEpoch, timeUnits, type WallTime } from "@/tools/unix-timestamp/lib/epoch";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  input: z.string().default("").describe("Unix timestamp, ISO-8601, RFC 2822, or now. Leave it empty when year, month, and day are set."),
  timeZone: z.string().default("UTC").describe("IANA time zone, such as UTC or America/New_York."),
  unit: z.enum(["auto", ...timeUnits]).default("auto"),
  year: z.number().int().optional(),
  month: z.number().int().optional(),
  day: z.number().int().optional(),
  hour: z.number().int().optional(),
  minute: z.number().int().optional(),
  second: z.number().int().optional(),
});

export const outputSchema = z.object({
  seconds: z.string(),
  milliseconds: z.string(),
  isoUtc: z.string(),
  isoLocal: z.string(),
  rfc2822: z.string(),
  relative: z.string(),
  weekday: z.string(),
  offset: z.string(),
  timeZone: z.string(),
  unit: z.string(),
  alternateIsoUtc: z.string(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const now = Date.now();
  const hasWall = parsed.year !== undefined || parsed.month !== undefined || parsed.day !== undefined;
  const result = hasWall
    ? convertToEpoch({
        year: parsed.year ?? 1970,
        month: parsed.month ?? 1,
        day: parsed.day ?? 1,
        hour: parsed.hour ?? 0,
        minute: parsed.minute ?? 0,
        second: parsed.second ?? 0,
        millisecond: 0,
      } satisfies WallTime, parsed.timeZone, now)
    : convertToDate(parsed.input, parsed.timeZone, parsed.unit, now);
  if ("error" in result) throw new Error(result.error);
  return outputSchema.parse(result);
}

export const tool: BenchTool = {
  slug: "unix-timestamp",
  name: "convert_unix_timestamp",
  title: "Convert a unix timestamp",
  description: "Convert epoch seconds, milliseconds, microseconds, or nanoseconds to ISO-8601 and RFC 2822 in an IANA time zone, or convert a calendar time back to epoch.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
