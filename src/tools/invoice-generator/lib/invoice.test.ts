import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  calculateTotals,
  formatMoney,
  renderInvoicePdf,
  validateInvoice,
  type InvoiceData,
} from "@/tools/invoice-generator/lib/invoice";

function baseInvoice(overrides: Partial<InvoiceData> = {}): InvoiceData {
  return {
    kind: "invoice",
    number: "INV-0001",
    issueDate: "2026-10-18",
    dueDate: "2026-11-17",
    currency: "USD",
    from: { name: "Acme Studio", address: "1 Main St", email: "hi@acme.example" },
    to: { name: "Client Co", address: "2 Side Rd", email: "ap@client.example" },
    items: [{ description: "Design work", quantity: 1, rate: 100 }],
    taxRate: 0,
    discount: { type: "percent", value: 0 },
    notes: "",
    ...overrides,
  };
}

describe("calculateTotals", () => {
  it("applies 10% tax on $100", () => {
    const totals = calculateTotals(baseInvoice({ taxRate: 10 }));
    expect(totals).toMatchObject({
      subtotalCents: 10000,
      discountCents: 0,
      taxCents: 1000,
      totalCents: 11000,
      currency: "USD",
    });
  });

  it("applies a flat $5 discount before tax", () => {
    const totals = calculateTotals(baseInvoice({ discount: { type: "flat", value: 5 }, taxRate: 10 }));
    expect(totals.subtotalCents).toBe(10000);
    expect(totals.discountCents).toBe(500);
    expect(totals.taxCents).toBe(950); // 10% of 9500
    expect(totals.totalCents).toBe(10450);
  });

  it("applies a 20% percent discount", () => {
    const totals = calculateTotals(baseInvoice({ discount: { type: "percent", value: 20 }, taxRate: 10 }));
    expect(totals.discountCents).toBe(2000);
    expect(totals.taxCents).toBe(800); // 10% of 8000
    expect(totals.totalCents).toBe(8800);
  });

  it("rounds 3 x 19.99 at 8% tax without float drift", () => {
    const totals = calculateTotals(
      baseInvoice({ items: [{ description: "Widgets", quantity: 3, rate: 19.99 }], taxRate: 8 }),
    );
    expect(totals.subtotalCents).toBe(5997);
    expect(totals.taxCents).toBe(480); // 479.76 rounds to 480
    expect(totals.totalCents).toBe(6477);
  });

  it("sums fractional quantities and multiple items", () => {
    const totals = calculateTotals(
      baseInvoice({
        items: [
          { description: "Consulting", quantity: 1.5, rate: 80 },
          { description: "Travel", quantity: 2, rate: 25.5 },
        ],
      }),
    );
    expect(totals.subtotalCents).toBe(12000 + 5100);
    expect(totals.totalCents).toBe(17100);
  });

  it("throws on invalid inputs", () => {
    expect(() => calculateTotals(baseInvoice({ items: [{ description: "x", quantity: 0, rate: 10 }] }))).toThrow(/greater than zero/);
    expect(() => calculateTotals(baseInvoice({ items: [{ description: "x", quantity: -2, rate: 10 }] }))).toThrow(/greater than zero/);
    expect(() => calculateTotals(baseInvoice({ items: [{ description: "x", quantity: 1, rate: -1 }] }))).toThrow(/negative rate/);
    expect(() => calculateTotals(baseInvoice({ taxRate: 150 }))).toThrow(/exceed 100/);
    expect(() => calculateTotals(baseInvoice({ discount: { type: "percent", value: 120 } }))).toThrow(/exceed 100/);
    expect(() => calculateTotals(baseInvoice({ discount: { type: "flat", value: 200 } }))).toThrow(/larger than the subtotal/);
    expect(() => calculateTotals(baseInvoice({ items: [] }))).toThrow(/line item/);
    expect(() => calculateTotals(baseInvoice({ items: [{ description: "x", quantity: Number.NaN, rate: 10 }] }))).toThrow(/finite/);
  });
});

describe("formatMoney", () => {
  it("formats cents in the given currency", () => {
    expect(formatMoney(11000, "USD")).toBe("$110.00");
    expect(formatMoney(5997, "EUR")).toContain("59.97");
    expect(formatMoney(-500, "USD")).toBe("-$5.00");
  });

  it("falls back for unknown codes", () => {
    expect(formatMoney(1234, "XXX")).toContain("12.34");
  });
});

describe("validateInvoice", () => {
  it("accepts a complete invoice", () => {
    const result = validateInvoice(baseInvoice());
    expect(result.ok).toBe(true);
  });

  it("requires a number, named parties, and at least one item", () => {
    const empty = validateInvoice(baseInvoice({ number: "", items: [] }));
    expect(empty.ok).toBe(false);
    if (!empty.ok) {
      expect(empty.errors.join("\n")).toMatch(/number/);
      expect(empty.errors.join("\n")).toMatch(/line item/);
    }

    const noName = validateInvoice(baseInvoice({ to: { name: "", address: "", email: "" } }));
    expect(noName.ok).toBe(false);
    if (!noName.ok) {
      expect(noName.errors.join("\n")).toMatch(/to\.name/);
    }

    const notAnObject = validateInvoice("nope");
    expect(notAnObject.ok).toBe(false);
    if (!notAnObject.ok) expect(notAnObject.errors.length).toBeGreaterThan(0);
  });

  it("rejects a due date before the issue date", () => {
    const result = validateInvoice(baseInvoice({ issueDate: "2026-10-18", dueDate: "2026-10-01" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join("\n")).toMatch(/due date/i);
  });
});

describe("renderInvoicePdf", () => {
  it("writes a PDF with the expected page count", async () => {
    const bytes = await renderInvoicePdf(baseInvoice({ kind: "quote", notes: "Pay within 30 days." }));
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it("paginates a long item list", async () => {
    const items = Array.from({ length: 60 }, (_, index) => ({
      description: `Line item ${index + 1} with a somewhat long description to wrap`,
      quantity: index + 1,
      rate: 12.5,
    }));
    const bytes = await renderInvoicePdf(baseInvoice({ items, discount: { type: "flat", value: 10 }, taxRate: 7 }));
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThan(1);
  });

  it("throws on invalid input before rendering", async () => {
    await expect(renderInvoicePdf(baseInvoice({ taxRate: 999 }))).rejects.toThrow(/exceed 100/);
  });
});
