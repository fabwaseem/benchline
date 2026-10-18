import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "json-schema-validate",
  name: "JSON Schema",
  tagline: "Infer a schema from JSON, validate against one, and export TypeScript and Zod.",
  description:
    "Free JSON Schema generator and validator. Infer a schema from a sample, check a document against a schema you paste, and export TypeScript types and a Zod object. Errors include the path that failed.",
  category: "json",
  tags: ["json", "schema", "zod"],
  keywords: ["json schema validator", "json to typescript", "json to zod"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "FileJson",
  related: ["json-formatter", "json-yaml-convert", "csv-json-convert", "sql-formatter"],
  faqs: [
    { q: "Does one sample describe every future document?", a: "No. The inferred schema describes the sample. A field that is missing from the sample is not optional, and a mixed array becomes anyOf or a wider number type." },
    { q: "Which schema draft is used for validation?", a: "Validation uses Ajv. The $schema keyword is not fetched. A draft-07 document of ordinary keywords validates. The inferred schema is a plain JSON Schema object." },
    { q: "Where do the TypeScript and Zod types come from?", a: "They are generated from the inferred schema of the JSON sample. They describe the sample, not a schema you paste in the validate tab." },
  ],
  seo: {
    title: "JSON Schema validator and generator",
    description: "Infer JSON Schema from a sample, validate a document, and export TypeScript and Zod.",
  },
  howTo: [
    { name: "Paste JSON", text: "A sample is enough to infer a schema, TypeScript, and Zod." },
    { name: "Or paste a schema", text: "Switch to Validate and add a schema. Each error names a path such as /year." },
    { name: "Copy the export", text: "The TypeScript type and the Zod object can be copied on their own." },
  ],
  inputs: "JSON text, and an optional JSON Schema.",
  outputs: "An inferred or echoed schema, validation errors with paths, a TypeScript type, and a Zod object.",
  runsLocally: true,
  badges: ["Schema · TypeScript · Zod"],
} satisfies ToolMeta;
