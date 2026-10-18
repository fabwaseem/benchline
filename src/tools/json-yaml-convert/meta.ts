import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "json-yaml-convert",
  name: "JSON YAML converter",
  tagline: "Convert JSON, YAML, TOML, and XML in the browser, and keep the line number when a document fails.",
  description:
    "Free converter for JSON to YAML, YAML to JSON, TOML, and XML to JSON. The source format can be detected automatically. Errors include a line and column. Conversion stays in the browser.",
  category: "json",
  tags: ["json", "yaml", "toml", "xml", "convert"],
  keywords: ["json to yaml", "yaml to json", "xml to json", "toml to json"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "ArrowLeftRight",
  related: ["json-formatter", "csv-json-convert", "diff-checker", "base64-codec"],
  faqs: [
    { q: "Which direction does this convert?", a: "Any of JSON, YAML, TOML, and XML can be the source or the target. Auto reads the first line and picks JSON, XML, TOML, or YAML." },
    { q: "Is the conversion lossless?", a: "JSON, YAML, TOML, and XML round-trip objects, arrays, strings, numbers, and booleans, including integers and decimals that do not fit in a JavaScript number. TOML has no null and no array or scalar at the document root, so those documents are refused instead of being dropped. XML attributes come back as @name and mixed text as #text." },
    { q: "Why does yes stay a string?", a: "YAML is read with the JSON schema, so yes, no, and dates stay strings. That keeps a config from changing type on the way to JSON." },
    { q: "Where does the error line come from?", a: "JSON, YAML, TOML, and XML parsers each report a line and column, counted from 1. The message is the parser's reason, not a guess." },
  ],
  seo: {
    title: "JSON, YAML, TOML, and XML converter",
    description: "Convert JSON to YAML, YAML to JSON, TOML, and XML to JSON in the browser, with line and column errors.",
  },
  howTo: [
    { name: "Paste a document", text: "Leave the source on Auto, or choose JSON, YAML, TOML, or XML if the first line is ambiguous." },
    { name: "Pick the target", text: "The other pane updates as you type. TOML refuses null and a root that is not a table." },
    { name: "Copy or download", text: "A valid result can be copied or saved. An invalid one names the line and column." },
  ],
  inputs: "A JSON, YAML, TOML, or XML document, a source format, and a target format.",
  outputs: "The document in the target format, or a line and column for the parse error.",
  runsLocally: true,
  badges: ["JSON · YAML · TOML · XML"],
} satisfies ToolMeta;
