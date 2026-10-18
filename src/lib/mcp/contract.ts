import { z } from "zod";
import type { BenchTool } from "@/lib/mcp/types";

const NAME = /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/;

export function assertToolContract(tool: BenchTool) {
  if (!NAME.test(tool.name)) {
    throw new Error(`${tool.slug} must use a snake_case verb_noun name.`);
  }
  if (!tool.title.trim() || !tool.description.trim()) {
    throw new Error(`${tool.slug} needs a title and a description.`);
  }
  if (typeof tool.run !== "function") throw new Error(`${tool.slug} is missing run.`);
  const input = jsonSchema(tool.inputSchema, `${tool.slug} input`);
  const output = jsonSchema(tool.outputSchema, `${tool.slug} output`);
  if (input.type !== "object") throw new Error(`${tool.slug} input schema must be an object.`);
  if (output.type !== "object") throw new Error(`${tool.slug} output schema must be an object.`);
}

function jsonSchema(schema: z.ZodType, label: string) {
  if (!(schema instanceof z.ZodType)) throw new Error(`${label} schema is not a zod schema.`);
  try {
    return z.toJSONSchema(schema) as { type?: unknown };
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid schema";
    throw new Error(`${label} schema is invalid: ${message}`);
  }
}
