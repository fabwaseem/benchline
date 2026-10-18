import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InvoiceParty = {
  name: string;
  address: string;
  email: string;
};

export type InvoiceItem = {
  /** Human-readable line description. */
  description: string;
  /** Billed quantity in units (may be fractional, e.g. 1.5 hours). */
  quantity: number;
  /** Unit price in major currency units (e.g. dollars). */
  rate: number;
};

export type Discount = {
  type: "percent" | "flat";
  /** Percent 0-100 when type is "percent", major currency units when "flat". */
  value: number;
};

export type InvoiceData = {
  kind: "invoice" | "quote";
  number: string;
  issueDate: string;
  dueDate: string;
  /** ISO 4217 code, e.g. "USD". */
  currency: string;
  from: InvoiceParty;
  to: InvoiceParty;
  items: InvoiceItem[];
  /** Tax percent, 0-100. */
  taxRate: number;
  discount: Discount;
  notes: string;
};

export type InvoiceTotals = {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
};

// ---------------------------------------------------------------------------
// Zod schema (shared by the UI and the MCP handler)
// ---------------------------------------------------------------------------

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const partySchema = z.object({
  name: z.string().min(1, "A name is required"),
  address: z.string().default(""),
  email: z.string().default(""),
});

const itemSchema = z.object({
  description: z.string().min(1, "Each item needs a description"),
  quantity: z.number({ error: "Quantity must be a number" }).positive("Quantity must be greater than zero"),
  rate: z.number({ error: "Rate must be a number" }).nonnegative("Rate cannot be negative"),
});

const discountSchema = z.object({
  type: z.enum(["percent", "flat"]),
  value: z.number({ error: "Discount must be a number" }).nonnegative("Discount cannot be negative"),
});

export const invoiceSchema = z.object({
  kind: z.enum(["invoice", "quote"]),
  number: z.string().min(1, "An invoice or quote number is required"),
  issueDate: dateSchema,
  dueDate: dateSchema,
  currency: z.string().regex(/^[A-Za-z]{3}$/, "Use a 3-letter currency code such as USD"),
  from: partySchema,
  to: partySchema,
  items: z.array(itemSchema).min(1, "Add at least one line item"),
  taxRate: z.number({ error: "Tax rate must be a number" }).nonnegative("Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100%"),
  discount: discountSchema,
  notes: z.string().default(""),
});

// ---------------------------------------------------------------------------
// Money math (all in integer cents)
// ---------------------------------------------------------------------------

/** Convert a major-unit amount to integer cents, rounding half up. */
export function toCents(major: number): number {
  return Math.round(major * 100);
}

/** Line total in cents for one item. */
export function lineTotalCents(item: InvoiceItem): number {
  assertNumber(item.quantity, "quantity");
  assertNumber(item.rate, "rate");
  return Math.round(item.quantity * toCents(item.rate));
}

function assertNumber(value: number, label: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
}

/**
 * Compute subtotal, discount, tax and total in integer cents.
 * Tax is applied after the discount. Throws descriptive errors on bad input.
 */
export function calculateTotals(data: InvoiceData): InvoiceTotals {
  assertNumber(data.taxRate, "Tax rate");
  if (data.taxRate > 100) throw new Error("Tax rate cannot exceed 100%.");
  assertNumber(data.discount.value, "Discount");
  if (data.discount.value < 0) throw new Error("Discount cannot be negative.");
  if (data.discount.type === "percent" && data.discount.value > 100) {
    throw new Error("A percent discount cannot exceed 100%.");
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error("Add at least one line item.");
  }

  const subtotalCents = data.items.reduce((sum, item) => {
    assertNumber(item.quantity, "Item quantity");
    if (item.quantity <= 0) throw new Error(`Item "${item.description || "unnamed"}" has a quantity of ${item.quantity}. Quantity must be greater than zero.`);
    assertNumber(item.rate, "Item rate");
    if (item.rate < 0) throw new Error(`Item "${item.description || "unnamed"}" has a negative rate.`);
    return sum + lineTotalCents(item);
  }, 0);

  const discountCents =
    data.discount.type === "percent"
      ? Math.round((subtotalCents * data.discount.value) / 100)
      : toCents(data.discount.value);
  if (discountCents > subtotalCents) {
    throw new Error("The discount is larger than the subtotal.");
  }

  const taxableCents = subtotalCents - discountCents;
  const taxCents = Math.round((taxableCents * data.taxRate) / 100);
  const totalCents = taxableCents + taxCents;

  return { subtotalCents, discountCents, taxCents, totalCents, currency: data.currency };
}

/** Format integer cents as a currency string, e.g. $1,234.56. */
export function formatMoney(cents: number, currency: string): string {
  assertNumber(cents, "cents");
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
  } catch {
    // Unknown currency code: fall back to code + decimal amount.
    const sign = cents < 0 ? "-" : "";
    const abs = Math.abs(cents);
    return `${sign}${currency.toUpperCase()} ${(Math.floor(abs / 100)).toLocaleString("en-US")}.${String(abs % 100).padStart(2, "0")}`;
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type InvoiceValidation =
  | { ok: true; invoice: InvoiceData }
  | { ok: false; errors: string[] };

/** Validate an unknown payload, returning friendly errors instead of throwing. */
export function validateInvoice(data: unknown): InvoiceValidation {
  const parsed = invoiceSchema.safeParse(data);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "invoice";
      return `${path}: ${issue.message}`;
    });
    return { ok: false, errors };
  }
  const errors: string[] = [];
  const invoice = parsed.data as InvoiceData;
  if (invoice.dueDate < invoice.issueDate) {
    errors.push("dueDate: the due date cannot be before the issue date");
  }
  try {
    calculateTotals(invoice);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "The numbers do not add up.");
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, invoice };
}

// ---------------------------------------------------------------------------
// PDF rendering (pdf-lib, A4)
// ---------------------------------------------------------------------------

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const ROW_H = 22;
const LINE_H = 13;

const INK = rgb(0.13, 0.13, 0.14);
const MUTED = rgb(0.45, 0.45, 0.47);
const RULE = rgb(0.83, 0.83, 0.84);
const HEAD_BG = rgb(0.96, 0.96, 0.96);
const ACCENT = rgb(0.16, 0.32, 0.6);

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split(/\r?\n/);
  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push("");
      continue;
    }
    const words = paragraph.split(/\s+/);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines.filter((line, index) => !(line === "" && index === lines.length - 1));
}

/** Render the invoice as a single A4 PDF document (multiple pages when long). */
export async function renderInvoicePdf(invoice: InvoiceData): Promise<Uint8Array> {
  const totals = calculateTotals(invoice);
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  function need(height: number) {
    if (y - height < MARGIN + 24) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  }

  function text(value: string, x: number, size: number, usedFont: PDFFont, color = INK) {
    page.drawText(value, { x, y, size, font: usedFont, color });
  }

  function right(value: string, size: number, usedFont: PDFFont, color = INK) {
    const width = usedFont.widthOfTextAtSize(value, size);
    text(value, PAGE_W - MARGIN - width, size, usedFont, color);
  }

  const contentW = PAGE_W - MARGIN * 2;
  const title = invoice.kind === "invoice" ? "INVOICE" : "QUOTE";

  // --- Header: kind + number (left), dates (right) --------------------------
  text(title, MARGIN, 26, bold, ACCENT);
  y -= 24;
  text(`#${invoice.number}`, MARGIN, 13, bold);
  y -= 20;
  right(`Issued  ${invoice.issueDate}`, 10, font, MUTED);
  y -= 13;
  right(invoice.kind === "invoice" ? `Due  ${invoice.dueDate}` : `Valid until  ${invoice.dueDate}`, 10, font, MUTED);
  y -= 18;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1.5, color: ACCENT });
  y -= 22;

  // --- Parties ----------------------------------------------------------------
  need(90);
  text("From", MARGIN, 10, bold, MUTED);
  text("Bill to", MARGIN + contentW / 2, 10, bold, MUTED);
  y -= 15;
  drawParty(invoice.from, MARGIN);
  drawParty(invoice.to, MARGIN + contentW / 2);
  y -= 24;

  function drawParty(party: InvoiceParty, x: number) {
    let yy = y;
    page.drawText(party.name, { x, y: yy, size: 12, font: bold, color: INK, maxWidth: contentW / 2 - 12 });
    yy -= 15;
    for (const line of wrapText(party.address, font, 10, contentW / 2 - 12)) {
      page.drawText(line, { x, y: yy, size: 10, font, color: MUTED });
      yy -= LINE_H;
    }
    if (party.email) {
      page.drawText(party.email, { x, y: yy, size: 10, font, color: MUTED });
      yy -= LINE_H;
    }
    y = Math.min(y, yy);
  }

  // --- Item table --------------------------------------------------------------
  const colDesc = MARGIN;
  const colQty = PAGE_W - MARGIN - 260;
  const colRate = PAGE_W - MARGIN - 150;
  const colAmt = PAGE_W - MARGIN;
  const descW = colQty - colDesc - 12;

  function tableHeader() {
    need(ROW_H + 8);
    page.drawRectangle({ x: MARGIN, y: y - 6, width: contentW, height: ROW_H, color: HEAD_BG });
    const ty = y + 1;
    page.drawText("Description", { x: colDesc + 8, y: ty, size: 10, font: bold, color: INK });
    page.drawText("Qty", { x: colQty, y: ty, size: 10, font: bold, color: INK });
    page.drawText("Rate", { x: colRate, y: ty, size: 10, font: bold, color: INK });
    const amtLabel = "Amount";
    page.drawText(amtLabel, { x: colAmt - font.widthOfTextAtSize(amtLabel, 10), y: ty, size: 10, font: bold, color: INK });
    y -= ROW_H;
  }

  tableHeader();
  for (const item of invoice.items) {
    const lines = wrapText(item.description, font, 10, descW);
    const rowH = Math.max(ROW_H, lines.length * LINE_H + 10);
    need(rowH);
    let ly = y;
    for (const line of lines) {
      page.drawText(line, { x: colDesc + 8, y: ly, size: 10, font, color: INK });
      ly -= LINE_H;
    }
    const mid = y - rowH / 2 + 3.5;
    const qty = formatQty(item.quantity);
    page.drawText(qty, { x: colQty, y: mid, size: 10, font, color: INK });
    page.drawText(formatMoney(toCents(item.rate), invoice.currency), { x: colRate, y: mid, size: 10, font, color: INK });
    const amount = formatMoney(lineTotalCents(item), invoice.currency);
    page.drawText(amount, { x: colAmt - font.widthOfTextAtSize(amount, 10), y: mid, size: 10, font, color: INK });
    page.drawLine({ start: { x: MARGIN, y: y - rowH + 4 }, end: { x: PAGE_W - MARGIN, y: y - rowH + 4 }, thickness: 0.5, color: RULE });
    y -= rowH;
  }
  y -= 18;

  // --- Totals -------------------------------------------------------------------
  need(4 * 20 + 30);
  const labelX = PAGE_W - MARGIN - 170;
  function totalRow(label: string, cents: number, strong = false, size = 11) {
    const value = formatMoney(cents, invoice.currency);
    page.drawText(label, { x: labelX, y, size, font: strong ? bold : font, color: strong ? INK : MUTED });
    page.drawText(value, { x: colAmt - (strong ? bold : font).widthOfTextAtSize(value, size), y, size, font: strong ? bold : font, color: INK });
    y -= 19;
  }
  totalRow("Subtotal", totals.subtotalCents);
  if (totals.discountCents > 0) {
    const discLabel = invoice.discount.type === "percent" ? `Discount (${invoice.discount.value}%)` : "Discount";
    totalRow(discLabel, -totals.discountCents);
  }
  totalRow(`Tax (${invoice.taxRate}%)`, totals.taxCents);
  page.drawLine({ start: { x: labelX, y: y + 4 }, end: { x: PAGE_W - MARGIN, y: y + 4 }, thickness: 1, color: INK });
  totalRow(invoice.kind === "invoice" ? "Total due" : "Total", totals.totalCents, true, 14);
  y -= 10;

  // --- Notes ----------------------------------------------------------------------
  if (invoice.notes.trim()) {
    need(40);
    text("Notes", MARGIN, 10, bold, MUTED);
    y -= 15;
    for (const line of wrapText(invoice.notes, font, 10, contentW)) {
      need(LINE_H + 2);
      text(line, MARGIN, 10, font, MUTED);
      y -= LINE_H;
    }
    y -= 8;
  }

  // --- Page footers -----------------------------------------------------------------
  const pages = doc.getPages();
  pages.forEach((p, index) => {
    const footer = `Page ${index + 1} of ${pages.length}`;
    p.drawText(footer, {
      x: PAGE_W / 2 - font.widthOfTextAtSize(footer, 8) / 2,
      y: MARGIN / 2,
      size: 8,
      font,
      color: MUTED,
    });
  });

  return doc.save();
}

function formatQty(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : String(quantity);
}
