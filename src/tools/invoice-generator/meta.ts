import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "invoice-generator",
  name: "Invoice Generator",
  tagline: "Build invoices and quotes in the browser. Add line items, tax and discounts, then download a clean PDF.",
  description:
    "Free invoice generator. Enter your company and client details, add line items, set tax and discounts in any currency, then download a professional PDF invoice or quote. Everything runs locally in the browser — nothing is uploaded.",
  category: "finance",
  tags: ["invoice", "billing"],
  keywords: ["invoice generator", "free invoice maker", "quote generator", "invoice pdf", "billing tool"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Receipt",
  related: ["loan-emi-calculator", "pdf-merge", "percentage-calculator"],
  faqs: [
    { q: "Is my invoice data uploaded anywhere?", a: "No. Everything runs locally in the browser. Your company and client details, line items, and the generated PDF never leave this tab." },
    { q: "Can I make quotes as well as invoices?", a: "Yes. Switch the document type to Quote and the header, labels, and totals adjust automatically. The file downloads as a quote PDF." },
    { q: "Which currencies are supported?", a: "Any ISO currency code such as USD, EUR, GBP, or PKR. Totals are computed in integer cents to avoid rounding errors, then formatted for the currency you picked." },
    { q: "How are discounts and tax calculated?", a: "The discount is applied to the subtotal first, then tax is charged on the discounted amount. Flat discounts are capped at the subtotal so totals never go negative." },
    { q: "Does the invoice get a number automatically?", a: "No, you choose the number so it fits your own invoicing scheme — for example INV-0001 or Q-2026-114." },
  ],
  seo: {
    title: "Invoice Generator",
    description: "Free invoice generator that runs in your browser. Create invoices and quotes with line items, tax, discounts, and multi-currency support, then download a PDF. No upload, no sign-up.",
  },
  howTo: [
    { name: "Fill in the details", text: "Add your company and client information, the invoice number, and dates. Everything stays in this browser." },
    { name: "Add line items", text: "List each item with its quantity and rate, then set a tax rate and an optional percent or flat discount." },
    { name: "Download the PDF", text: "Preview the totals live, then download a clean A4 PDF invoice or quote." },
  ],
  inputs: "Company and client details, an invoice or quote number, dates, a currency code, line items with quantities and rates, a tax rate, and an optional percent or flat discount.",
  outputs: "A formatted A4 PDF invoice or quote, with a totals breakdown (subtotal, discount, tax, total).",
  runsLocally: true,
  badges: ["In this browser"],
} satisfies ToolMeta;
