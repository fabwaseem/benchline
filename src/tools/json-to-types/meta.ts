import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "json-to-types",
  name: "JSON to Types",
  tagline: "Paste JSON, get TypeScript, Zod, Pydantic, dataclass, and Go types.",
  description:
    "Free JSON to type converter. Paste a JSON document and generate TypeScript interfaces, Zod schemas, Python Pydantic models or dataclasses, and Go structs. Optional fields are detected across array items, nulls become nullable, and nested objects get their own named types.",
  category: "json",
  tags: ["json", "types", "typescript"],
  keywords: ["json to typescript", "json to zod", "json to pydantic", "json to go struct", "json type generator"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Braces",
  related: ["json-formatter", "json-schema-validate", "json-yaml-convert", "schema-generator"],
  faqs: [
    { q: "How are optional fields detected?", a: "When the top level is an array of objects, a property missing from any item becomes optional. A property present everywhere stays required." },
    { q: "What happens with null values?", a: "Null becomes nullable in every target: `| null` in TypeScript, `.nullable()` in Zod, Optional in Python, and `any` in Go." },
    { q: "How are empty arrays typed?", a: "An empty array has no items to learn from, so it becomes unknown[] (or Any). Fill it in for a precise type; a warning is shown." },
    { q: "What about very large numbers?", a: "A number that does not fit in a JavaScript number still generates a number type, and a warning names the original digits. The type cannot store those digits exactly." },
    { q: "Is my JSON sent anywhere?", a: "No. Conversion runs entirely in the browser on this page." },
  ],
  seo: {
    title: "JSON to Types",
    description: "Convert JSON to TypeScript interfaces, Zod schemas, Python Pydantic models, dataclasses, and Go structs — free, in the browser.",
  },
  howTo: [
    { name: "Paste your JSON", text: "Drop a JSON document into the editor, upload a .json file, or start from the sample." },
    { name: "Pick the targets", text: "Toggle TypeScript, Zod, Pydantic, dataclass, and Go. Set the root type name." },
    { name: "Copy the output", text: "Each target gets its own tab with copy and download buttons." },
  ],
  inputs: "A JSON document, the root type name, and the target languages.",
  outputs: "Type definitions per target, plus warnings for ambiguous shapes.",
  runsLocally: true,
  badges: ["5 targets · Offline"],
} satisfies ToolMeta;
