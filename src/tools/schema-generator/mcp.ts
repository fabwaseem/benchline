import { z } from "zod";
import { buildSchema, schemaTypes, scriptTag, validateSchema, type SchemaValues } from "@/tools/schema-generator/lib/schema";
import type { BenchTool } from "@/lib/mcp/types";

const field = z.union([
  z.string(),
  z.array(
    z.object({
      q: z.string().optional(),
      a: z.string().optional(),
      name: z.string().optional(),
      text: z.string().optional(),
      url: z.string().optional(),
    }),
  ),
]);

export const inputSchema = z.object({
  type: z.enum(schemaTypes),
  values: z.record(z.string(), field).describe("Fields for the chosen schema.org type. Repeatable fields are arrays of objects."),
});

export const outputSchema = z.object({
  json: z.json(),
  script: z.string(),
  checks: z.array(z.object({ level: z.enum(["pass", "warn", "fail"]), label: z.string(), detail: z.string() })),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const values = parsed.values as SchemaValues;
  const json = buildSchema(parsed.type, values);
  return outputSchema.parse({
    json,
    script: scriptTag(json),
    checks: validateSchema(parsed.type, values),
  });
}

export const tool: BenchTool = {
  slug: "schema-generator",
  name: "build_json_ld",
  title: "Build JSON-LD",
  description: "Build schema.org JSON-LD for one type, plus a script tag and a list of missing fields. Use this when you already know the fields. It does not fetch a page.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
