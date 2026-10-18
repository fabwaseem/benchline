import { z } from "zod";
import type { BenchTool } from "@/lib/mcp/types";
import { listOgTemplates, ogTemplateCategories } from "@/tools/og-template-list/lib/list";

const colorSchema = z.object({
  background: z.string(),
  foreground: z.string(),
  accent: z.string(),
  muted: z.string(),
});

export const inputSchema = z.object({
  category: z.enum(ogTemplateCategories).optional(),
});

export const outputSchema = z.object({
  templates: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    fields: z.array(z.object({
      key: z.string(),
      label: z.string(),
      kind: z.enum(["text", "textarea"]),
    })),
    images: z.array(z.string()),
    defaults: z.record(z.string(), z.string()),
    colors: colorSchema,
    presets: z.array(z.object({ name: z.string(), colors: colorSchema })),
    schema: z.record(z.string(), z.unknown()),
  })),
});

function fieldJsonSchema(fields: string[]) {
  const shape: Record<string, z.ZodType> = {};
  for (const key of fields) shape[key] = z.string();
  return z.toJSONSchema(z.object(shape)) as Record<string, unknown>;
}

async function run(input: unknown) {
  const parsed = inputSchema.parse(input ?? {});
  return outputSchema.parse({
    templates: listOgTemplates(parsed.category).map((template) => ({
      id: template.id,
      name: template.name,
      category: template.category,
      fields: template.fields,
      images: template.images,
      defaults: template.defaults,
      colors: template.colors,
      presets: template.presets,
      schema: fieldJsonSchema(template.fieldKeys),
    })),
  });
}

export const tool: BenchTool = {
  slug: "og-template-list",
  name: "list_og_templates",
  title: "List Open Graph templates",
  description: "List Open Graph card templates with ids, names, categories, defaults, color presets, and field schemas.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
