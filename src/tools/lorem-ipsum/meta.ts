import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "lorem-ipsum",
  name: "Lorem ipsum",
  tagline: "Placeholder copy, or fake rows as JSON, CSV, and SQL, from a seed.",
  description:
    "Free lorem ipsum and fake data generator. Write words, sentences, or paragraphs, or build a small table of names, emails, and other fields and download JSON, CSV, or SQL. The same seed repeats the same rows.",
  category: "fixtures",
  tags: ["mock", "data", "faker"],
  keywords: ["lorem ipsum generator", "fake data generator", "mock json"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Dices",
  related: ["json-formatter", "csv-json-convert", "uuid-generator", "regex-tester"],
  faqs: [
    { q: "Will the same seed produce the same rows?", a: "Yes. The generator is seeded, so a seed, a field list, and a row count always rebuild the same table." },
    { q: "Are the names real people?", a: "No. They come from a fake-data library. Do not treat an email or a phone number as a real contact." },
    { q: "What names are allowed in SQL?", a: "Table and field names must start with a letter or underscore and contain only letters, digits, and underscores. Values are quoted." },
  ],
  seo: {
    title: "Lorem ipsum and fake data generator",
    description: "Generate lorem ipsum or seeded fake JSON, CSV, and SQL rows in the browser.",
  },
  howTo: [
    { name: "Pick copy or rows", text: "Lorem writes placeholder prose. Rows builds a table from the fields you add." },
    { name: "Set a seed", text: "Change the seed to get a new sample. Keep it to repeat the same one." },
    { name: "Copy JSON, CSV, or SQL", text: "Row output can be copied or downloaded in any of the three formats." },
  ],
  inputs: "A lorem length, or a field list, row count, seed, and output format.",
  outputs: "Placeholder prose, or JSON, CSV, or an INSERT statement.",
  runsLocally: true,
  badges: ["Seeded · JSON CSV SQL"],
} satisfies ToolMeta;
