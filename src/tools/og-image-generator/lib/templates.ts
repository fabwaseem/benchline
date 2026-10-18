import {
  renderAurora,
  renderBeforeAfter,
  renderBlueprint,
  renderBrutalist,
  renderChangelog,
  renderEditorial,
  renderEvent,
  renderGlass,
  renderLaunch,
  renderMinimal,
  renderPodcast,
  renderProduct,
  renderProfile,
  renderQuote,
  renderSplit,
  renderStat,
  renderTerminal,
  renderTutorial,
} from "@/tools/og-image-generator/lib/cards";
import { colorsOf, fieldsOf, type ColorPreset, type FieldKey, type ImageKey, type OgCategory, type OgTemplate, type TitleSpec } from "@/tools/og-image-generator/lib/types";

const FIELD_META: Record<FieldKey, { label: string; kind: "text" | "textarea" }> = {
  title: { label: "Title", kind: "text" },
  subtitle: { label: "Subtitle", kind: "text" },
  author: { label: "Author", kind: "text" },
  role: { label: "Role", kind: "text" },
  eyebrow: { label: "Eyebrow", kind: "text" },
  badge: { label: "Badge", kind: "text" },
  date: { label: "Date", kind: "text" },
  time: { label: "Time", kind: "text" },
  price: { label: "Price", kind: "text" },
  cta: { label: "Button", kind: "text" },
  url: { label: "URL", kind: "text" },
  stat: { label: "Stat", kind: "text" },
  statLabel: { label: "Stat label", kind: "text" },
  quote: { label: "Quote", kind: "textarea" },
  episode: { label: "Episode", kind: "text" },
  readTime: { label: "Read time", kind: "text" },
  meta: { label: "Meta", kind: "textarea" },
  command: { label: "Command", kind: "textarea" },
  steps: { label: "Steps", kind: "textarea" },
  versions: { label: "Versions", kind: "textarea" },
  beforeValue: { label: "Before value", kind: "text" },
  afterValue: { label: "After value", kind: "text" },
  caption: { label: "Caption", kind: "text" },
};

export const IMAGE_LABELS: Record<ImageKey, string> = {
  logo: "Drop a logo. It stays in this browser.",
  avatar: "Drop a portrait. It stays in this browser.",
  hero: "Drop an image. It stays in this browser.",
  before: "Drop the before image. It stays in this browser.",
  after: "Drop the after image. It stays in this browser.",
};

export function fieldMeta(key: FieldKey) {
  return FIELD_META[key];
}

function preset(name: string, background: string, foreground: string, accent: string, muted: string): ColorPreset {
  return { name, colors: colorsOf(background, foreground, accent, muted) };
}

function define(input: {
  id: string;
  name: string;
  category: OgCategory;
  fields: FieldKey[];
  images?: ImageKey[];
  defaults: Partial<ReturnType<typeof fieldsOf>>;
  colors: ReturnType<typeof colorsOf>;
  presets: ColorPreset[];
  font: OgTemplate["font"];
  headline: FieldKey;
  titleSpec: TitleSpec;
  render: OgTemplate["render"];
}): OgTemplate {
  return {
    ...input,
    images: input.images ?? [],
    defaults: fieldsOf(input.defaults),
  };
}

export const ogTemplates: OgTemplate[] = [
  define({
    id: "editorial",
    name: "Editorial",
    category: "Blog",
    fields: ["title", "author", "readTime"],
    images: ["logo"],
    font: "serif",
    headline: "title",
    titleSpec: { base: 84, min: 42, width: 1000, maxLines: 3 },
    colors: colorsOf("#f6f1e7", "#1c1915", "#1c1915", "#6b645c"),
    presets: [
      preset("Paper", "#f6f1e7", "#1c1915", "#1c1915", "#6b645c"),
      preset("Ink", "#16130f", "#f6f4ef", "#e8590c", "#a39c91"),
      preset("Sage", "#e7efe6", "#1c2a22", "#1f6b45", "#4e6558"),
    ],
    defaults: { title: "Designing tools people return to", author: "Ada Lovelace", readTime: "8 min read" },
    render: renderEditorial,
  }),
  define({
    id: "aurora",
    name: "Aurora",
    category: "Product",
    fields: ["title", "url"],
    images: ["logo"],
    font: "sans",
    headline: "title",
    titleSpec: { base: 78, min: 40, width: 980, maxLines: 3 },
    colors: colorsOf("#070b18", "#f8fafc", "#60a5fa", "#c4b5fd"),
    presets: [
      preset("Night", "#070b18", "#f8fafc", "#60a5fa", "#c4b5fd"),
      preset("Dusk", "#14081f", "#fff7ed", "#f97316", "#fdba74"),
      preset("Sea", "#04141c", "#ecfeff", "#22d3ee", "#67e8f9"),
    ],
    defaults: { title: "Ship faster with Benchline", url: "benchline.dev" },
    render: renderAurora,
  }),
  define({
    id: "blueprint",
    name: "Blueprint",
    category: "Dev",
    fields: ["eyebrow", "title"],
    font: "sans",
    headline: "title",
    titleSpec: { base: 78, min: 40, width: 980, maxLines: 3 },
    colors: colorsOf("#071433", "#e8eef9", "#8eb4ff", "rgba(142,180,255,0.18)"),
    presets: [
      preset("Navy", "#071433", "#e8eef9", "#8eb4ff", "rgba(142,180,255,0.18)"),
      preset("Graph", "#0c1f1c", "#e7f6f1", "#5eead4", "rgba(94,234,212,0.16)"),
      preset("Ink grid", "#121212", "#f5f5f5", "#e8590c", "rgba(255,255,255,0.08)"),
    ],
    defaults: { eyebrow: "DOCS / API", title: "Rate limits explained" },
    render: renderBlueprint,
  }),
  define({
    id: "terminal",
    name: "Terminal",
    category: "Dev",
    fields: ["title", "command"],
    font: "mono",
    headline: "title",
    titleSpec: { base: 64, min: 32, width: 380, maxLines: 4 },
    colors: colorsOf("#0e0e10", "#f4f4f5", "#3ddc6a", "#a1a1aa"),
    presets: [
      preset("Green", "#0e0e10", "#f4f4f5", "#3ddc6a", "#a1a1aa"),
      preset("Amber", "#14110c", "#fff7ed", "#f59e0b", "#a8a29e"),
      preset("Ice", "#0b1220", "#e0f2fe", "#38bdf8", "#94a3b8"),
    ],
    defaults: {
      title: "Get started in 30 seconds",
      command: "$ npx benchline init\n> Creating new Benchline project...\n> Installing dependencies...\n> Configuring...\n> Done! Ready to build.",
    },
    render: renderTerminal,
  }),
  define({
    id: "split",
    name: "Split",
    category: "Blog",
    fields: ["eyebrow", "title"],
    images: ["hero"],
    font: "sans",
    headline: "title",
    titleSpec: { base: 64, min: 34, width: 500, maxLines: 4 },
    colors: colorsOf("#ffffff", "#16130f", "#e8590c", "#6b645c"),
    presets: [
      preset("Signal", "#ffffff", "#16130f", "#e8590c", "#6b645c"),
      preset("Ink", "#16130f", "#f6f4ef", "#ff9a55", "#a39c91"),
      preset("Blue", "#f8fafc", "#0f172a", "#2563eb", "#64748b"),
    ],
    defaults: { eyebrow: "SEO STRATEGY", title: "The 2026 SEO checklist" },
    render: renderSplit,
  }),
  define({
    id: "brutalist",
    name: "Brutalist",
    category: "Social",
    fields: ["title"],
    font: "sans",
    headline: "title",
    titleSpec: { base: 120, min: 48, width: 1000, maxLines: 2 },
    colors: colorsOf("#f25c05", "#111111", "#111111", "#111111"),
    presets: [
      preset("Orange", "#f25c05", "#111111", "#111111", "#111111"),
      preset("Yellow", "#ffe14a", "#111111", "#111111", "#111111"),
      preset("Black", "#111111", "#f6f4ef", "#f6f4ef", "#f6f4ef"),
    ],
    defaults: { title: "Stop guessing" },
    render: renderBrutalist,
  }),
  define({
    id: "launch",
    name: "Launch",
    category: "Product",
    fields: ["badge", "title", "steps"],
    images: ["logo"],
    font: "sans",
    headline: "title",
    titleSpec: { base: 68, min: 36, width: 600, maxLines: 3 },
    colors: colorsOf("#efe6ff", "#24183a", "#7c3aed", "#6d28d9"),
    presets: [
      preset("Lilac", "#efe6ff", "#24183a", "#7c3aed", "#6d28d9"),
      preset("Mint", "#e5f6ee", "#14281f", "#0f9f6e", "#3f6f5b"),
      preset("Peach", "#fff1e8", "#3b1d12", "#e8590c", "#9a3412"),
    ],
    defaults: { badge: "NEW · v2.0", title: "Introducing Agent Mode", steps: "Research\nAnalyze\nGenerate report" },
    render: renderLaunch,
  }),
  define({
    id: "profile",
    name: "Profile",
    category: "Social",
    fields: ["title", "role", "meta"],
    images: ["avatar"],
    font: "sans",
    headline: "title",
    titleSpec: { base: 72, min: 40, width: 740, maxLines: 2 },
    colors: colorsOf("#ffffff", "#16130f", "#16130f", "#6b645c"),
    presets: [
      preset("Paper", "#ffffff", "#16130f", "#16130f", "#6b645c"),
      preset("Night", "#16130f", "#f6f4ef", "#e8590c", "#a39c91"),
      preset("Blue", "#f8fafc", "#0f172a", "#2563eb", "#64748b"),
    ],
    defaults: { title: "Sara Khan", role: "Staff Engineer at Linear", meta: "6+ years at Linear\nRemote · GMT +5\nTypeScript · React · Rails" },
    render: renderProfile,
  }),
  define({
    id: "stat",
    name: "Stat",
    category: "Product",
    fields: ["stat", "statLabel", "author"],
    images: ["logo"],
    font: "sans",
    headline: "stat",
    titleSpec: { base: 180, min: 72, width: 1000, maxLines: 1 },
    colors: colorsOf("#0e0e10", "#f6f4ef", "#3ddc6a", "#a1a1aa"),
    presets: [
      preset("Green", "#0e0e10", "#f6f4ef", "#3ddc6a", "#a1a1aa"),
      preset("Orange", "#0e0e10", "#fff7ed", "#ff7a1a", "#a8a29e"),
      preset("Paper", "#f6f1e7", "#16130f", "#e8590c", "#6b645c"),
    ],
    defaults: { stat: "3.2x", statLabel: "faster page loads after the migration", author: "LINEAR" },
    render: renderStat,
  }),
  define({
    id: "quote",
    name: "Quote",
    category: "Blog",
    fields: ["quote", "author", "role"],
    images: ["avatar"],
    font: "serif",
    headline: "quote",
    titleSpec: { base: 54, min: 30, width: 1040, maxLines: 4 },
    colors: colorsOf("#fbf7f1", "#1c1915", "#e8590c", "#6b645c"),
    presets: [
      preset("Cream", "#fbf7f1", "#1c1915", "#e8590c", "#6b645c"),
      preset("Ink", "#16130f", "#f6f4ef", "#ff9a55", "#a39c91"),
      preset("Blue", "#f4f7fb", "#142033", "#2563eb", "#5b6b80"),
    ],
    defaults: { quote: "Simple tools, used daily, beat clever ones used once.", author: "Waseem Anjum", role: "Founder, Benchline" },
    render: renderQuote,
  }),
  define({
    id: "event",
    name: "Event",
    category: "Event",
    fields: ["date", "title", "subtitle", "time", "cta"],
    font: "sans",
    headline: "title",
    titleSpec: { base: 58, min: 32, width: 740, maxLines: 3 },
    colors: colorsOf("#1a1033", "#f8f5ff", "#ff6a1a", "#c4b5fd"),
    presets: [
      preset("Night", "#1a1033", "#f8f5ff", "#ff6a1a", "#c4b5fd"),
      preset("Forest", "#10241c", "#f3fff8", "#34d399", "#a7f3d0"),
      preset("Ink", "#111111", "#fff7ed", "#f59e0b", "#d6d3d1"),
    ],
    defaults: { date: "OCT 24", title: "Benchline Live: Building MCP tools", subtitle: "Online", time: "6 PM PKT", cta: "Register →" },
    render: renderEvent,
  }),
  define({
    id: "podcast",
    name: "Podcast",
    category: "Social",
    fields: ["episode", "title"],
    images: ["hero"],
    font: "sans",
    headline: "title",
    titleSpec: { base: 58, min: 32, width: 560, maxLines: 3 },
    colors: colorsOf("#0e0e10", "#f6f4ef", "#ff7a1a", "#a1a1aa"),
    presets: [
      preset("Signal", "#0e0e10", "#f6f4ef", "#ff7a1a", "#a1a1aa"),
      preset("Violet", "#12081f", "#f5f3ff", "#a78bfa", "#c4b5fd"),
      preset("Paper", "#f6f1e7", "#16130f", "#e8590c", "#6b645c"),
    ],
    defaults: { episode: "EP 42", title: "Shipping side projects" },
    render: renderPodcast,
  }),
  define({
    id: "changelog",
    name: "Changelog",
    category: "Product",
    fields: ["title", "versions"],
    font: "sans",
    headline: "title",
    titleSpec: { base: 64, min: 36, width: 900, maxLines: 2 },
    colors: colorsOf("#f7f4ee", "#1c1915", "#1c1915", "#5c564e"),
    presets: [
      preset("Paper", "#f7f4ee", "#1c1915", "#1c1915", "#5c564e"),
      preset("Ink", "#16130f", "#f6f4ef", "#e8590c", "#a39c91"),
      preset("Mint", "#eef6f1", "#14281f", "#0f9f6e", "#3f6f5b"),
    ],
    defaults: { title: "What's new in October", versions: "v2.3 | Smarter MCP routing & bug fixes\nv2.2 | Team workspaces & permissions\nv2.1 | API improvements & stability" },
    render: renderChangelog,
  }),
  define({
    id: "glass",
    name: "Glass",
    category: "Social",
    fields: ["title"],
    images: ["logo"],
    font: "sans",
    headline: "title",
    titleSpec: { base: 64, min: 34, width: 640, maxLines: 2 },
    colors: colorsOf("#fb7185", "#ffffff", "#fb7185", "#ffffff"),
    presets: [
      preset("Sunset", "#fb7185", "#ffffff", "#fb7185", "#ffffff"),
      preset("Aurora", "#22d3ee", "#ffffff", "#7c3aed", "#ffffff"),
      preset("Ember", "#f97316", "#fff7ed", "#ea580c", "#ffedd5"),
    ],
    defaults: { title: "Designing in public" },
    render: renderGlass,
  }),
  define({
    id: "minimal-mono",
    name: "Minimal mono",
    category: "Dev",
    fields: ["command"],
    font: "mono",
    headline: "command",
    titleSpec: { base: 64, min: 28, width: 980, maxLines: 2 },
    colors: colorsOf("#000000", "#ffffff", "#ffffff", "#a1a1aa"),
    presets: [
      preset("Black", "#000000", "#ffffff", "#ffffff", "#a1a1aa"),
      preset("Paper", "#f6f1e7", "#16130f", "#16130f", "#6b645c"),
      preset("Green", "#052e16", "#dcfce7", "#4ade80", "#86efac"),
    ],
    defaults: { command: "> benchline --help" },
    render: renderMinimal,
  }),
  define({
    id: "product",
    name: "Product",
    category: "Product",
    fields: ["title", "subtitle", "price", "cta"],
    images: ["hero"],
    font: "sans",
    headline: "title",
    titleSpec: { base: 68, min: 36, width: 540, maxLines: 2 },
    colors: colorsOf("#e7d7c4", "#1c1915", "#1c1915", "#6b645c"),
    presets: [
      preset("Sand", "#e7d7c4", "#1c1915", "#1c1915", "#6b645c"),
      preset("Stone", "#eceae6", "#16130f", "#16130f", "#6b645c"),
      preset("Ink", "#1c1915", "#f6f1e7", "#e7d7c4", "#a39c91"),
    ],
    defaults: { title: "Runner Pro", subtitle: "All-day comfort. Built to move.", price: "$129", cta: "Shop now →" },
    render: renderProduct,
  }),
  define({
    id: "tutorial",
    name: "Tutorial steps",
    category: "Dev",
    fields: ["title", "steps"],
    font: "sans",
    headline: "title",
    titleSpec: { base: 64, min: 34, width: 980, maxLines: 2 },
    colors: colorsOf("#e7f3e4", "#14281f", "#14281f", "#3f6f5b"),
    presets: [
      preset("Mint", "#e7f3e4", "#14281f", "#14281f", "#3f6f5b"),
      preset("Sky", "#e5f0fb", "#0f172a", "#1d4ed8", "#475569"),
      preset("Paper", "#f6f1e7", "#1c1915", "#e8590c", "#6b645c"),
    ],
    defaults: { title: "Deploy Next.js to Vercel", steps: "Connect your Git repository\nAdd environment variables\nDeploy & ship" },
    render: renderTutorial,
  }),
  define({
    id: "before-after",
    name: "Before/After",
    category: "Product",
    fields: ["beforeValue", "afterValue", "caption"],
    images: ["before", "after"],
    font: "sans",
    headline: "caption",
    titleSpec: { base: 28, min: 18, width: 900, maxLines: 2 },
    colors: colorsOf("#f3e6e2", "#1c1915", "#1c1915", "#6b645c"),
    presets: [
      preset("Blush", "#f3e6e2", "#1c1915", "#1c1915", "#6b645c"),
      preset("Slate", "#e7e5e4", "#1c1917", "#1c1917", "#57534e"),
      preset("Ink", "#16130f", "#f6f4ef", "#3ddc6a", "#a39c91"),
    ],
    defaults: { beforeValue: "2.4 MB", afterValue: "310 KB", caption: "Image compress · 2.4 MB → 310 KB" },
    render: renderBeforeAfter,
  }),
];

export const TEMPLATE_IDS = ogTemplates.map((template) => template.id) as [string, ...string[]];

export function templateById(id: string) {
  return ogTemplates.find((template) => template.id === id) ?? ogTemplates[0];
}

export function templateSchemaRows(template: OgTemplate) {
  return template.fields.map((key) => ({ key, ...FIELD_META[key] }));
}
