import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "currency-converter",
  name: "Currency Converter",
  tagline: "Live exchange rates, historical trends, and multi-currency tables.",
  description:
    "Free currency converter with live exchange rates. Convert any amount between 30+ currencies, see a 30/90/365-day trend chart, and compare one currency against a full table. Rates come from the Frankfurter API (ECB reference data).",
  category: "finance",
  tags: ["currency", "exchange", "forex"],
  keywords: ["currency converter", "exchange rate", "forex converter", "usd to eur", "money converter"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Coins",
  related: ["unit-converter", "percentage-calculator", "loan-emi-calculator"],
  faqs: [
    { q: "Where do the rates come from?", a: "The Frankfurter API, which publishes the European Central Bank's reference rates. Rates update once per ECB business day, so the 'as of' date is shown under the result." },
    { q: "Is my conversion sent anywhere?", a: "Only the rate lookup goes out: your browser fetches public rates from api.frankfurter.app. The amount you type never leaves this page." },
    { q: "Why is there no rate for today?", a: "The ECB publishes rates once per business day, usually in the afternoon European time. On weekends and holidays the latest available business day is shown." },
    { q: "Can I convert crypto?", a: "No. This tool covers fiat currencies only — the 32 most traded ISO 4217 codes." },
  ],
  seo: {
    title: "Currency Converter — Live Exchange Rates",
    description: "Convert between 30+ currencies with live exchange rates, 1-year trend charts, and multi-currency comparison tables. Free, no sign-up.",
  },
  howTo: [
    { name: "Enter an amount", text: "Type the amount in the From currency. The result updates as soon as rates load." },
    { name: "Pick the pair", text: "Choose the From and To currencies, or hit the swap button to flip them." },
    { name: "Read the trend", text: "Switch between 30D, 90D, and 1Y to see how the pair moved, with the period change in percent." },
  ],
  inputs: "An amount and two ISO 4217 currency codes.",
  outputs: "The converted amount, the rate used, a multi-currency table, and a historical trend chart.",
  runsLocally: false,
  badges: ["Live rates · Frankfurter"],
} satisfies ToolMeta;
