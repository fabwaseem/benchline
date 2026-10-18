import { z } from "zod";
import { csvToJson, delimiters, jsonToCsv } from "@/tools/csv-json-convert/lib/convert";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  text: z.string(),
  direction: z.enum(["csv-to-json", "json-to-csv"]).default("csv-to-json"),
  delimiter: z.enum(["auto", ...delimiters]).default("auto").describe("Comma, tab, semicolon, pipe, or auto. Auto is a comma when writing CSV."),
  header: z.boolean().default(true),
  inferTypes: z.boolean().default(true).describe("Used when converting CSV to JSON."),
  flatten: z.boolean().default(false).describe("Used when converting JSON to CSV. Nested keys become dotted columns."),
});

export const outputSchema = z.object({
  ok: z.boolean(),
  output: z.string(),
  error: z.string(),
  warning: z.string(),
  rows: z.number().int(),
  columns: z.number().int(),
  delimiter: z.string(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const result = parsed.direction === "csv-to-json"
    ? csvToJson(parsed.text, parsed)
    : jsonToCsv(parsed.text, parsed);
  return outputSchema.parse(result);
}

export const tool: BenchTool = {
  slug: "csv-json-convert",
  name: "convert_csv_json",
  title: "Convert CSV and JSON",
  description: "Convert CSV to JSON or JSON to CSV. Supports comma, tab, semicolon, and pipe delimiters, an optional header, type inference, and dotted flattening. Inferred numbers that do not fit in a JavaScript number keep their digits.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
