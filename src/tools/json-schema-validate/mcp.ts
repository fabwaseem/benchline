import { z } from "zod";
import { exportTypes, inspectJson } from "@/tools/json-schema-validate/lib/schema";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  json: z.string().describe("JSON document to infer from or validate."),
  schema: z.string().optional().describe("JSON Schema. Omit it to infer a schema from the document."),
});

export const outputSchema = z.object({
  valid: z.boolean(),
  schema: z.string(),
  typescript: z.string(),
  zod: z.string(),
  errors: z.array(z.object({
    path: z.string(),
    message: z.string(),
  })),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const report = inspectJson(parsed.json, parsed.schema ?? "");
  const exported = report.errors.some((error) => error.message.includes("not valid JSON")) && !report.schema
    ? { typescript: "", zod: "", error: "" }
    : exportTypes(parsed.json);
  const errors = [...report.errors];
  if (exported.error) errors.push({ path: "/", message: exported.error });
  return outputSchema.parse({
    valid: report.valid && !exported.error,
    schema: report.schema,
    typescript: exported.typescript,
    zod: exported.zod,
    errors,
  });
}

export const tool: BenchTool = {
  slug: "json-schema-validate",
  name: "validate_json_schema",
  title: "Infer or validate JSON Schema",
  description: "Infer a JSON Schema from a sample, or validate JSON against a schema. Returns error paths plus TypeScript and Zod generated from the sample.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
