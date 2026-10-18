import { z } from "zod";
import { convertJsonToTypes, TARGETS, type Target } from "@/tools/json-to-types/lib/convert";
import type { BenchTool } from "@/lib/mcp/types";

const targetEnum = z.enum(TARGETS);

export const inputSchema = z.object({
  json: z.string().min(1).max(500_000),
  rootName: z.string().max(80).default("Root"),
  targets: z.array(targetEnum).min(1).default(["typescript"] as Target[]),
});

export const outputSchema = z.object({
  outputs: z.record(z.string(), z.string()),
  warnings: z.array(z.string()),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const result = convertJsonToTypes(parsed.json, { rootName: parsed.rootName, targets: parsed.targets });
  if ("error" in result) throw new Error(result.error);
  return outputSchema.parse({ outputs: result.outputs, warnings: result.warnings });
}

export const tool: BenchTool = {
  slug: "json-to-types",
  name: "convert_json_to_types",
  title: "Convert JSON to type definitions",
  description:
    "Infer types from a JSON document and generate TypeScript interfaces, Zod schemas, Python Pydantic models or dataclasses, and Go structs.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
