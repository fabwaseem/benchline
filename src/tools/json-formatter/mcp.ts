import { z } from "zod";
import { formatJson, indents } from "@/tools/json-formatter/lib/format";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  json: z.string().describe("JSON text to format or validate."),
  indent: z.enum(indents).default("2"),
  sortKeys: z.boolean().default(false).describe("Sort object keys. Array order is kept."),
  minify: z.boolean().default(false),
});

export const outputSchema = z.object({
  output: z.string(),
  valid: z.boolean(),
  errors: z.array(z.object({
    message: z.string(),
    line: z.number().int(),
    column: z.number().int(),
  })),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const result = formatJson(parsed.json, parsed);
  return outputSchema.parse({
    output: result.output,
    valid: result.valid,
    errors: result.errors.map((error) => ({ message: error.message, line: error.line, column: error.column })),
  });
}

export const tool: BenchTool = {
  slug: "json-formatter",
  name: "format_json",
  title: "Format and validate JSON",
  description: "Pretty-print or minify JSON. A number that does not fit in a JavaScript number keeps the digits you sent. Returns the formatted text when it is valid, or the line and column of each syntax error.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
