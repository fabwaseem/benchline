import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "unit-converter",
  name: "Unit converter",
  tagline: "Length, mass, temperature, and data sizes, with decimal and binary units kept apart.",
  description:
    "Free unit converter for length, mass, volume, temperature, area, speed, and time, plus decimal data units (kB, MB) and binary data units (KiB, MiB). Set the number of decimal places.",
  category: "units",
  tags: ["units"],
  keywords: ["unit converter", "mb to gb", "celsius to fahrenheit"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Ruler",
  related: ["percentage-calculator", "date-difference", "color-converter", "unix-timestamp"],
  faqs: [
    { q: "What is the difference between MB and MiB?", a: "A decimal megabyte is 1,000 kilobytes. A binary mebibyte is 1,024 kibibytes. They are separate categories so a file size is not silently converted with the wrong base." },
    { q: "How precise is a length conversion?", a: "Metric steps such as meters to centimeters are exact. Imperial ratios come from the convert-units tables, then the result is rounded half up to the precision you set." },
    { q: "Can temperature be negative?", a: "Yes. Data sizes cannot. Zero Celsius is 32 Fahrenheit, and zero kelvin is −273.15 Celsius." },
  ],
  seo: {
    title: "Unit converter",
    description: "Convert length, mass, temperature, and decimal or binary data sizes with a chosen precision.",
  },
  howTo: [
    { name: "Pick a category", text: "Length, mass, volume, temperature, area, speed, time, or data. Decimal and binary data are separate." },
    { name: "Choose the units", text: "Enter a value and the precision. Swap exchanges the two units." },
    { name: "Read the whole category", text: "The selected result is on top. Every other unit in the category is listed under it." },
  ],
  inputs: "A category, a source unit, a target unit, a value, and a precision from 0 to 12.",
  outputs: "The converted value and the same value in every unit of the category.",
  runsLocally: true,
  badges: ["Decimal · Binary"],
} satisfies ToolMeta;
