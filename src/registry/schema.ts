import { z } from "zod";

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a kebab-case slug");

export const toolStatusSchema = z.enum([
  "stable",
  "beta",
  "new",
  "deprecated",
]);

export const faqSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
});

export const howToStepSchema = z.object({
  name: z.string().min(1),
  text: z.string().min(1),
});

export const categorySchema = z.object({
  slug,
  name: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
  hue: z.number().int().min(0).max(359),
});

export const toolMetaSchema = z.object({
  slug,
  name: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  category: slug,
  tags: z.array(slug).min(1),
  keywords: z.array(z.string().min(1)).min(1),
  status: toolStatusSchema,
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  icon: z.string().min(1),
  accent: z.string().optional(),
  related: z.array(slug),
  faqs: z.array(faqSchema).min(1),
  seo: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    ogTitle: z.string().optional(),
  }),
  howTo: z.array(howToStepSchema).min(1),
  inputs: z.string().min(1),
  outputs: z.string().min(1),
  runsLocally: z.boolean(),
});

export type ToolStatus = z.infer<typeof toolStatusSchema>;
export type Faq = z.infer<typeof faqSchema>;
export type HowToStep = z.infer<typeof howToStepSchema>;
export type Category = z.infer<typeof categorySchema>;
export type ToolMeta = z.infer<typeof toolMetaSchema>;

export type SearchRecord = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  tags: string[];
  keywords: string[];
  status: ToolStatus;
  icon: string;
  runsLocally: boolean;
};
