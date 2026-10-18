export const OG_SIZES = {
  "1200x630": { width: 1200, height: 630, label: "1200×630" },
  "1600x900": { width: 1600, height: 900, label: "X 1600×900" },
  "1080x1080": { width: 1080, height: 1080, label: "Square 1080" },
} as const;

export type OgSizeId = keyof typeof OG_SIZES;

export const OG_CATEGORIES = ["Blog", "Product", "Dev", "Social", "Event"] as const;
export type OgCategory = (typeof OG_CATEGORIES)[number];

export type OgColors = {
  background: string;
  foreground: string;
  accent: string;
  muted: string;
};

export type OgFields = {
  title: string;
  subtitle: string;
  author: string;
  role: string;
  eyebrow: string;
  badge: string;
  date: string;
  time: string;
  price: string;
  cta: string;
  url: string;
  stat: string;
  statLabel: string;
  quote: string;
  episode: string;
  readTime: string;
  meta: string;
  command: string;
  steps: string;
  versions: string;
  beforeValue: string;
  afterValue: string;
  caption: string;
  brand: string;
};

export type FieldKey = keyof OgFields;

export type OgImages = {
  logo: string;
  avatar: string;
  hero: string;
  before: string;
  after: string;
};

export type ImageKey = keyof OgImages;

export type TitleSpec = {
  base: number;
  min: number;
  width: number;
  maxLines: number;
};

export type ColorPreset = {
  name: string;
  colors: OgColors;
};

export type TemplateRenderInput = {
  width: number;
  height: number;
  fields: OgFields;
  colors: OgColors;
  images: OgImages;
};

export type OgTemplate = {
  id: string;
  name: string;
  category: OgCategory;
  fields: FieldKey[];
  images: ImageKey[];
  defaults: OgFields;
  colors: OgColors;
  presets: ColorPreset[];
  font: "sans" | "serif" | "mono";
  headline: FieldKey;
  titleSpec: TitleSpec;
  render: (input: TemplateRenderInput) => React.ReactElement;
};

export const blankFields: OgFields = {
  title: "",
  subtitle: "",
  author: "",
  role: "",
  eyebrow: "",
  badge: "",
  date: "",
  time: "",
  price: "",
  cta: "",
  url: "",
  stat: "",
  statLabel: "",
  quote: "",
  episode: "",
  readTime: "",
  meta: "",
  command: "",
  steps: "",
  versions: "",
  beforeValue: "",
  afterValue: "",
  caption: "",
  brand: "Benchline",
};

export const blankImages: OgImages = {
  logo: "",
  avatar: "",
  hero: "",
  before: "",
  after: "",
};

export function fieldsOf(partial: Partial<OgFields>): OgFields {
  return { ...blankFields, ...partial };
}

export function colorsOf(background: string, foreground: string, accent: string, muted: string): OgColors {
  return { background, foreground, accent, muted };
}
