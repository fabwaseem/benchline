import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "percentage-calculator",
  name: "Percentage calculator",
  tagline: "Percent of, percent change, reverse percent, and margin, with the formula shown.",
  description:
    "Free percentage calculator. Find X% of Y, what percent X is of Y, the change from one number to another, the original value, an increase or decrease, and margin versus markup. Arithmetic uses decimal rounding.",
  category: "finance",
  tags: ["math", "percent"],
  keywords: ["percentage calculator", "percent change", "margin calculator"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Percent",
  related: ["loan-emi-calculator", "unit-converter", "date-difference", "unix-timestamp"],
  faqs: [
    { q: "What is the difference between margin and markup?", a: "Margin is profit divided by price. Markup is profit divided by cost. A price of 100 on a cost of 60 is a 40% margin and a 66.67% markup." },
    { q: "Why not ordinary floating point?", a: "Values such as 10% of 1 and 1 out of 3 are calculated with decimal.js and rounded half up to 8 decimal places, then trailing zeros are removed." },
    { q: "Can the change be negative?", a: "Yes. A drop from 100 to 80 is −20%." },
  ],
  seo: {
    title: "Percentage calculator",
    description: "Calculate percent of, percent change, reverse percent, increase, decrease, and margin.",
  },
  howTo: [
    { name: "Choose the form", text: "Percent of a value, what percent one value is of another, change, reverse, increase, decrease, or margin." },
    { name: "Enter the two numbers", text: "The labels change with the form. Margin asks for cost and price." },
    { name: "Read the formula", text: "The result sits next to the expression that produced it." },
  ],
  inputs: "A percentage form and two numbers.",
  outputs: "The result and the formula. Margin also includes profit and markup.",
  runsLocally: true,
  badges: ["Formula · Margin"],
} satisfies ToolMeta;
