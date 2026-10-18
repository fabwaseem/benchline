import { z } from "zod";
import { generateUuids, inspectUuid, uuidVersions } from "@/tools/uuid-generator/lib/uuid";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  action: z.enum(["generate", "inspect"]).default("generate"),
  version: z.enum(uuidVersions).default("v4"),
  count: z.number().int().min(1).max(10_000).default(1),
  value: z.string().optional().describe("UUID to inspect when action is inspect."),
});

export const outputSchema = z.object({
  ids: z.array(z.string()),
  version: z.number().int().nullable(),
  variant: z.string(),
  timestamp: z.string(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  if (parsed.action === "inspect") {
    const info = inspectUuid(parsed.value ?? "");
    if ("error" in info) throw new Error(info.error);
    return outputSchema.parse({ ids: [info.uuid], version: info.version, variant: info.variant, timestamp: info.timestamp });
  }
  const ids = generateUuids(parsed.version, parsed.count);
  if ("error" in ids) throw new Error(ids.error);
  return outputSchema.parse({ ids, version: parsed.version === "v4" ? 4 : 7, variant: "RFC 4122", timestamp: "" });
}

export const tool: BenchTool = {
  slug: "uuid-generator",
  name: "generate_uuid",
  title: "Generate or inspect a UUID",
  description: "Generate UUID version 4 or version 7 from cryptographic randomness, up to 10,000 at once, or inspect the version, variant, and v7 timestamp.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
