import { z } from "zod";
import { defaultFields, fieldKinds, generateLorem, generateRows, loremKinds, outputFormats } from "@/tools/lorem-ipsum/lib/generate";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  mode: z.enum(["lorem", "rows"]).default("lorem"),
  kind: z.enum(loremKinds).default("paragraphs"),
  count: z.number().int().min(1).max(500).default(3),
  seed: z.number().int().min(0).max(2_147_483_647).default(1),
  rows: z.number().int().min(1).max(200).default(10),
  format: z.enum(outputFormats).default("json"),
  table: z.string().default("records"),
  fields: z.array(z.object({
    name: z.string(),
    kind: z.enum(fieldKinds),
  })).max(30).optional(),
});

export const outputSchema = z.object({
  output: z.string(),
  format: z.enum(["text", "json", "csv", "sql"]),
  rows: z.number().int(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  if (parsed.mode === "lorem") {
    return outputSchema.parse({
      output: await generateLorem(parsed.kind, parsed.count, parsed.seed),
      format: "text",
      rows: parsed.count,
    });
  }
  const fields = parsed.fields ?? defaultFields;
  return outputSchema.parse({
    output: await generateRows(fields, parsed.rows, parsed.seed, parsed.format, parsed.table),
    format: parsed.format,
    rows: parsed.rows,
  });
}

export const tool: BenchTool = {
  slug: "lorem-ipsum",
  name: "generate_fake_data",
  title: "Generate lorem ipsum or fake rows",
  description: "Generate seeded lorem ipsum, or fake JSON, CSV, or SQL rows from a list of field types.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
