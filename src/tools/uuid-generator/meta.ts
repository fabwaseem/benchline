import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "uuid-generator",
  name: "UUID generator",
  tagline: "Generate UUID v4 or v7 in bulk, and read the time stored in a v7 id.",
  description:
    "Free UUID and GUID generator for version 4 and version 7. Create one id or a bulk list from cryptographic randomness, then inspect a UUID to see its version, variant, and v7 timestamp.",
  category: "crypto",
  tags: ["uuid", "guid"],
  keywords: ["uuid generator", "guid generator", "uuid v4", "uuid v7"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Fingerprint",
  related: ["hash-generator", "password-generator", "jwt-decoder", "url-codec"],
  faqs: [
    { q: "What is the difference between UUID v4 and v7?", a: "Version 4 is random. Version 7 starts with a unix timestamp in milliseconds, so ids sort roughly by creation time, then fills the rest with random bits." },
    { q: "Where does the randomness come from?", a: "crypto.getRandomValues. The ids are not invented by a language model and they are not a counter." },
    { q: "Can I recover the time from a v4 UUID?", a: "No. Version 4 has no timestamp. Version 7 does: the first 48 bits are the unix time in milliseconds." },
    { q: "How many can I generate at once?", a: "Up to 10,000. Copy or download the list as plain text, one id per line." },
  ],
  seo: {
    title: "UUID generator",
    description: "Generate UUID v4 or UUID v7 in bulk, and decode the timestamp inside a version 7 UUID.",
  },
  howTo: [
    { name: "Choose v4 or v7", text: "Use v4 for a random id. Use v7 when the id should sort by time." },
    { name: "Set how many you need", text: "One is enough for a single record. Raise the count for a fixture or a migration." },
    { name: "Paste an existing UUID to inspect it", text: "The version and variant are read from the bits. A v7 id also shows the UTC time it was minted." },
  ],
  inputs: "A version, a count, and an optional UUID to inspect.",
  outputs: "A list of UUIDs, or the version, variant, and v7 timestamp of one UUID.",
  runsLocally: true,
  badges: ["v4 · v7 · Bulk"],
} satisfies ToolMeta;
