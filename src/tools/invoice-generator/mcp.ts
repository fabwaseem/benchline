import { z } from "zod";
import { encodeBase64 } from "@/lib/base64";
import type { BenchTool } from "@/lib/mcp/types";
import { calculateTotals, invoiceSchema, renderInvoicePdf } from "@/tools/invoice-generator/lib/invoice";

export const inputSchema = z.object({
  invoice: invoiceSchema,
});

export const outputSchema = z.object({
  data: z.string().describe("Invoice or quote PDF as base64."),
  totalCents: z.number().int().describe("Grand total in integer cents."),
  currency: z.string().describe("ISO currency code used for the invoice."),
  bytes: z.number().int().describe("PDF size in bytes."),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const totals = calculateTotals(parsed.invoice);
  const bytes = await renderInvoicePdf(parsed.invoice);
  return outputSchema.parse({
    data: encodeBase64(bytes),
    totalCents: totals.totalCents,
    currency: totals.currency,
    bytes: bytes.byteLength,
  });
}

export const tool: BenchTool = {
  slug: "invoice-generator",
  name: "generate_invoice",
  title: "Generate an invoice or quote PDF",
  description:
    "Build an invoice or quote PDF from company and client details, line items with quantities and rates, a tax rate, and an optional percent or flat discount. All money is computed in integer cents, so there are no float rounding errors. Returns the PDF as base64 plus the total.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
