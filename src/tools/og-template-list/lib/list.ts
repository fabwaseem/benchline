import { ogTemplates, templateSchemaRows } from "@/tools/og-image-generator/lib/templates";
import { OG_CATEGORIES, type OgCategory } from "@/tools/og-image-generator/lib/types";

export const ogTemplateCategories = OG_CATEGORIES;

export type ListedOgTemplate = {
  id: string;
  name: string;
  category: OgCategory;
  fields: { key: string; label: string; kind: "text" | "textarea" }[];
  images: string[];
  defaults: Record<string, string>;
  colors: { background: string; foreground: string; accent: string; muted: string };
  presets: { name: string; colors: { background: string; foreground: string; accent: string; muted: string } }[];
  fieldKeys: string[];
};

export function listOgTemplates(category?: OgCategory): ListedOgTemplate[] {
  return ogTemplates
    .filter((template) => !category || template.category === category)
    .map((template) => ({
      id: template.id,
      name: template.name,
      category: template.category,
      fields: templateSchemaRows(template),
      images: [...template.images],
      defaults: Object.fromEntries(template.fields.map((key) => [key, template.defaults[key]])),
      colors: template.colors,
      presets: template.presets.map((preset) => ({ name: preset.name, colors: preset.colors })),
      fieldKeys: [...template.fields],
    }));
}
