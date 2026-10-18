import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "csv-json-convert",
  name: "CSV JSON converter",
  tagline: "Convert CSV to JSON and JSON back to CSV, with a delimiter and a header row you choose.",
  description:
    "Free CSV to JSON and JSON to CSV converter. Pick a comma, tab, semicolon, or pipe, or let the first row decide. Keep or drop the header, infer booleans and numbers, and flatten nested JSON into dotted columns. It runs in the browser.",
  category: "developer",
  tags: ["csv", "json", "convert"],
  keywords: ["csv to json", "json to csv", "csv converter"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Table2",
  related: ["json-formatter", "json-yaml-convert", "diff-checker", "base64-codec"],
  faqs: [
    { q: "Which delimiters work?", a: "Comma, tab, semicolon, and pipe. Auto counts separators outside quotes on the first record and uses the most common one. A tie stays a comma." },
    { q: "What does the header option do?", a: "With a header, the first CSV row becomes object keys and JSON objects become a header row. Without it, CSV becomes arrays of cells and JSON arrays of arrays are written as rows with no header." },
    { q: "Which values are inferred?", a: "true, false, null, and plain numbers, in either case for the words. A leading zero such as a ZIP code stays a string. Turn inference off to keep every cell a string." },
    { q: "How are nested objects written to CSV?", a: "Flatten joins keys with dots, so address.city becomes a column. Leave it off and the nested value is a JSON string in one cell." },
  ],
  seo: {
    title: "CSV to JSON and JSON to CSV",
    description: "Convert CSV to JSON and JSON to CSV in the browser. Choose the delimiter, header row, types, and nested flattening.",
  },
  howTo: [
    { name: "Choose a direction", text: "CSV to JSON reads a table. JSON to CSV writes one. The sample in each direction shows the shape that works." },
    { name: "Set the delimiter and header", text: "Auto detects the delimiter from the first record. Turn the header off for a grid with no names." },
    { name: "Copy the result", text: "Inferred types and flattened columns are applied before the output is shown. An unclosed quote is reported instead of a partial table." },
  ],
  inputs: "CSV or JSON text, a delimiter, a header toggle, and type inference or nested flattening.",
  outputs: "Pretty JSON, or CSV using the delimiter you picked, plus the row and column counts.",
  runsLocally: true,
  badges: ["Delimiter · Header · Types"],
} satisfies ToolMeta;
