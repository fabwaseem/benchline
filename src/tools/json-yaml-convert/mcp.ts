import { z } from "zod";
import { convertData, dataFormats } from "@/tools/json-yaml-convert/lib/convert";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  text: z.string().describe("The source document."),
  from: z.enum(["auto", ...dataFormats]).default("auto"),
  to: z.enum(dataFormats).default("json"),
});

export const outputSchema = z.object({
  ok: z.boolean(),
  output: z.string(),
  detected: z.string(),
  error: z.string(),
  line: z.number().int().nullable(),
  column: z.number().int().nullable(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const result = convertData(parsed.text, parsed.from, parsed.to);
  return outputSchema.parse({
    ok: result.ok,
    output: result.output,
    detected: result.detected ?? "",
    error: result.error,
    line: result.line,
    column: result.column,
  });
}

export const tool: BenchTool = {
  slug: "json-yaml-convert",
  name: "convert_data_format",
  title: "Convert JSON, YAML, TOML, or XML",
  description: "Convert between JSON, YAML, TOML, and XML. Auto-detects the source. Errors include a line and column. TOML refuses null and a non-table root.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
