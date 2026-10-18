import { z } from "zod";
import { readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { metaTagsFor, openGraphSource, renderOg, resolveState } from "@/tools/og-image-generator/lib/og";
import { renderOgPng } from "@/tools/og-image-generator/lib/png";
import { ogTemplates, TEMPLATE_IDS, templateSchemaRows } from "@/tools/og-image-generator/lib/templates";
import { OG_CATEGORIES, type ImageKey, type OgImages } from "@/tools/og-image-generator/lib/types";

const colorSchema = z.object({
  background: z.string(),
  foreground: z.string(),
  accent: z.string(),
  muted: z.string(),
});

const fieldKeys = [
  "title", "subtitle", "author", "role", "eyebrow", "badge", "date", "time", "price", "cta", "url",
  "stat", "statLabel", "quote", "episode", "readTime", "meta", "command", "steps", "versions",
  "beforeValue", "afterValue", "caption", "brand",
] as const;

const imageKeys = ["logo", "avatar", "hero", "before", "after"] as const;

export const inputSchema = z.object({
  template: z.enum(TEMPLATE_IDS).default(TEMPLATE_IDS[0] ?? "editorial").describe("Template id from list_og_templates."),
  size: z.enum(["1200x630", "1600x900", "1080x1080"]).default("1200x630"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  author: z.string().optional(),
  role: z.string().optional(),
  eyebrow: z.string().optional(),
  badge: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  price: z.string().optional(),
  cta: z.string().optional(),
  url: z.string().optional(),
  stat: z.string().optional(),
  statLabel: z.string().optional(),
  quote: z.string().optional(),
  episode: z.string().optional(),
  readTime: z.string().optional(),
  meta: z.string().optional(),
  command: z.string().optional(),
  steps: z.string().optional().describe("One step per line."),
  versions: z.string().optional().describe("One version per line, as v2.3 | Note."),
  beforeValue: z.string().optional(),
  afterValue: z.string().optional(),
  caption: z.string().optional(),
  brand: z.string().optional().describe("Brand name shown on templates that have a brand row."),
  colors: colorSchema.partial().optional(),
  logo: z.string().optional().describe("Logo image as base64, a data URI, or a public URL. Private addresses are refused. 10 MB cap."),
  avatar: z.string().optional().describe("Portrait image as base64, a data URI, or a public URL."),
  hero: z.string().optional().describe("Hero image as base64, a data URI, or a public URL."),
  before: z.string().optional().describe("Before image as base64, a data URI, or a public URL."),
  after: z.string().optional().describe("After image as base64, a data URI, or a public URL."),
  imageUrl: z.string().optional().describe("Public URL written into og:image. This does not fetch the file."),
});

export const outputSchema = z.object({
  template: z.string(),
  png: z.string().describe("PNG bytes, base64 encoded."),
  mimeType: z.literal("image/png"),
  width: z.number(),
  height: z.number(),
  source: z.string(),
  metaTags: z.string(),
});

export const listInputSchema = z.object({
  category: z.enum(OG_CATEGORIES).optional(),
});

export const listOutputSchema = z.object({
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

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const images = {} as OgImages;
  for (const key of imageKeys) {
    images[key] = await readImage(parsed[key], key);
  }
  const fields = Object.fromEntries(fieldKeys.flatMap((key) => {
    const value = parsed[key];
    return typeof value === "string" ? [[key, value]] : [];
  }));
  const state = resolveState({
    template: parsed.template,
    size: parsed.size,
    colors: parsed.colors,
    images,
    ...fields,
  });
  const png = await renderOgPng(renderOg(state), state.width, state.height);
  return outputSchema.parse({
    template: state.template.id,
    png: Buffer.from(png).toString("base64"),
    mimeType: "image/png",
    width: state.width,
    height: state.height,
    source: openGraphSource(state),
    metaTags: metaTagsFor(state, parsed.imageUrl),
  });
}

async function listRun(input: unknown) {
  const parsed = listInputSchema.parse(input ?? {});
  const templates = ogTemplates.filter((template) => !parsed.category || template.category === parsed.category);
  return listOutputSchema.parse({
    templates: templates.map((template) => ({
      id: template.id,
      name: template.name,
      category: template.category,
      fields: templateSchemaRows(template),
      images: template.images,
      defaults: Object.fromEntries(template.fields.map((key) => [key, template.defaults[key]])),
      colors: template.colors,
      presets: template.presets,
      schema: fieldJsonSchema(template.fields),
    })),
  });
}

function fieldJsonSchema(fields: string[]) {
  const shape: Record<string, z.ZodType> = {};
  for (const key of fields) shape[key] = z.string();
  return z.toJSONSchema(z.object(shape)) as Record<string, unknown>;
}

async function readImage(value: string | undefined, label: ImageKey) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  const file = /^https?:\/\//i.test(trimmed)
    ? await readMcpBytes({ url: trimmed }, label)
    : await readMcpBytes({ data: trimmed }, label);
  const mime = file.mimeType || "image/png";
  return `data:${mime};base64,${Buffer.from(file.bytes).toString("base64")}`;
}

export const tool: BenchTool = {
  slug: "og-image-generator",
  name: "build_open_graph",
  title: "Build an Open Graph card",
  description: "Render one of the Open Graph templates as a PNG and a Next.js opengraph-image.tsx file. Pass a template id from list_og_templates, the fields that template uses, colors, a size, and optional base64 images.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};

export const listTool: BenchTool = {
  slug: "og-image-generator",
  name: "list_og_templates",
  title: "List Open Graph templates",
  description: "List Open Graph card templates with ids, names, categories, defaults, color presets, and field schemas.",
  openWorld: false,
  inputSchema: listInputSchema,
  outputSchema: listOutputSchema,
  run: listRun,
};

export const tools = [tool, listTool];
