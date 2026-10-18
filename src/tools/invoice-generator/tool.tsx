"use client";

import { useMemo, useState } from "react";
import { Download, Plus, X } from "lucide-react";
import { ActionButton, TextArea, TextInput } from "@/components/kit/controls";
import { IconButton } from "@/components/kit/primitives/icon-button";
import { downloadBytes } from "@/components/kit/download-button";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import {
  calculateTotals,
  formatMoney,
  renderInvoicePdf,
  validateInvoice,
  type Discount,
  type InvoiceData,
  type InvoiceParty,
} from "@/tools/invoice-generator/lib/invoice";

type ItemRow = {
  id: string;
  description: string;
  quantity: string;
  rate: string;
};

const CURRENCIES = ["USD", "EUR", "GBP", "PKR", "AED", "SAR", "INR", "CAD", "AUD", "JPY"];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function newItem(): ItemRow {
  return { id: crypto.randomUUID(), description: "", quantity: "1", rate: "" };
}

function parseAmount(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export default function InvoiceGeneratorTool() {
  const [kind, setKind] = useState<"invoice" | "quote">("invoice");
  const [number, setNumber] = useState("INV-0001");
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(() => inDays(30));
  const [currency, setCurrency] = useState("USD");
  const [from, setFrom] = useState<InvoiceParty>({ name: "", address: "", email: "" });
  const [to, setTo] = useState<InvoiceParty>({ name: "", address: "", email: "" });
  const [items, setItems] = useState<ItemRow[]>([newItem()]);
  const [taxRate, setTaxRate] = useState("10");
  const [discountType, setDiscountType] = useState<Discount["type"]>("percent");
  const [discountValue, setDiscountValue] = useState("0");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const invoice = useMemo<InvoiceData>(
    () => ({
      kind,
      number: number.trim(),
      issueDate,
      dueDate,
      currency: currency.trim().toUpperCase(),
      from: { ...from, name: from.name.trim() },
      to: { ...to, name: to.name.trim() },
      items: items.map((item) => ({
        description: item.description.trim(),
        quantity: parseAmount(item.quantity),
        rate: parseAmount(item.rate),
      })),
      taxRate: parseAmount(taxRate),
      discount: { type: discountType, value: parseAmount(discountValue) },
      notes: notes.trim(),
    }),
    [kind, number, issueDate, dueDate, currency, from, to, items, taxRate, discountType, discountValue, notes],
  );

  const validation = useMemo(() => validateInvoice(invoice), [invoice]);
  const totals = useMemo(() => {
    if (!validation.ok) return null;
    try {
      return calculateTotals(validation.invoice);
    } catch {
      return null;
    }
  }, [validation]);

  const errors = submitted && !validation.ok ? validation.errors : [];

  async function download() {
    setSubmitted(true);
    if (!validation.ok) return;
    setBusy(true);
    try {
      const bytes = await renderInvoicePdf(validation.invoice);
      const safe = validation.invoice.number.replace(/[^a-z0-9-_]+/gi, "-") || "invoice";
      downloadBytes(`${kind}-${safe}.pdf`, bytes, "application/pdf");
    } finally {
      setBusy(false);
    }
  }

  useWorkbenchKeys({ onEnter: () => void download() });

  function setParty(which: "from" | "to", patch: Partial<InvoiceParty>) {
    if (which === "from") setFrom((current) => ({ ...current, ...patch }));
    else setTo((current) => ({ ...current, ...patch }));
  }

  function setRow(id: string, patch: Partial<ItemRow>) {
    setItems((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  return (
    <ToolCard>
      <ToolToolbar
        actions={
          <ActionButton className="btn btn-ink" onClick={() => void download()} disabled={busy}>
            <Download size={16} />
            {busy ? "Building PDF" : "Download PDF"}
          </ActionButton>
        }
      />
      <ToolPanes ratio="60/40">
        <Pane label="Details">
          <div className="flex flex-col gap-5">
            <FieldRow label="Document type" htmlFor="kind">
              <Segmented
                label="Document type"
                value={kind}
                onChange={setKind}
                options={[
                  { value: "invoice", label: "Invoice" },
                  { value: "quote", label: "Quote" },
                ]}
              />
            </FieldRow>

            <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
              <FieldRow label={kind === "invoice" ? "Invoice number" : "Quote number"} htmlFor="number">
                <TextInput id="number" value={number} onChange={(event) => setNumber(event.target.value)} placeholder="INV-0001" />
              </FieldRow>
              <FieldRow label="Currency" htmlFor="currency" help="Three-letter code">
                <TextInput id="currency" value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} maxLength={3} placeholder="USD" list="invoice-currencies" />
                <datalist id="invoice-currencies">
                  {CURRENCIES.map((code) => (
                    <option key={code} value={code} />
                  ))}
                </datalist>
              </FieldRow>
              <FieldRow label="Issue date" htmlFor="issue-date">
                <TextInput id="issue-date" type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
              </FieldRow>
              <FieldRow label={kind === "invoice" ? "Due date" : "Valid until"} htmlFor="due-date">
                <TextInput id="due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </FieldRow>
            </div>

            <PartyFields label="From (your company)" party={from} onChange={(patch) => setParty("from", patch)} prefix="from" />
            <PartyFields label="Bill to (client)" party={to} onChange={(patch) => setParty("to", patch)} prefix="to" />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-medium text-fg2">Line items</span>
                <ActionButton variant="outline" size="sm" onClick={() => setItems((current) => [...current, newItem()])}>
                  <Plus size={14} /> Add item
                </ActionButton>
              </div>
              {items.map((row, index) => (
                <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_76px_96px_auto] items-center gap-2">
                  <TextInput
                    aria-label={`Item ${index + 1} description`}
                    value={row.description}
                    placeholder={`Item ${index + 1}`}
                    onChange={(event) => setRow(row.id, { description: event.target.value })}
                  />
                  <TextInput
                    aria-label={`Item ${index + 1} quantity`}
                    value={row.quantity}
                    inputMode="decimal"
                    placeholder="Qty"
                    title="Quantity"
                    onChange={(event) => setRow(row.id, { quantity: event.target.value })}
                  />
                  <TextInput
                    aria-label={`Item ${index + 1} rate`}
                    value={row.rate}
                    inputMode="decimal"
                    placeholder="Rate"
                    title="Rate"
                    onChange={(event) => setRow(row.id, { rate: event.target.value })}
                  />
                  <IconButton
                    label={`Remove item ${index + 1}`}
                    size="sm"
                    disabled={items.length === 1}
                    onClick={() => setItems((current) => current.filter((item) => item.id !== row.id))}
                  >
                    <X size={14} />
                  </IconButton>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
              <FieldRow label="Tax rate %" htmlFor="tax-rate">
                <TextInput id="tax-rate" value={taxRate} inputMode="decimal" placeholder="10" onChange={(event) => setTaxRate(event.target.value)} />
              </FieldRow>
              <FieldRow label="Discount" htmlFor="discount-value">
                <div className="flex gap-2">
                  <Segmented
                    label="Discount type"
                    value={discountType}
                    onChange={setDiscountType}
                    options={[
                      { value: "percent", label: "%" },
                      { value: "flat", label: "Flat" },
                    ]}
                    className="shrink-0"
                  />
                  <TextInput id="discount-value" value={discountValue} inputMode="decimal" placeholder="0" onChange={(event) => setDiscountValue(event.target.value)} />
                </div>
              </FieldRow>
            </div>

            <FieldRow label="Notes" htmlFor="notes" help="Optional. Printed at the bottom of the PDF.">
              <TextArea id="notes" rows={3} value={notes} placeholder="Payment terms, bank details, thank-you note…" onChange={(event) => setNotes(event.target.value)} />
            </FieldRow>
          </div>
        </Pane>

        <Pane label="Preview & totals">
          <div className="flex flex-col gap-4">
            {errors.length > 0 ? (
              <Notice tone="bad" role="alert" title="Fix these before downloading" body={errors.join(" · ")} />
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <ResultStat label="Subtotal" value={totals ? formatMoney(totals.subtotalCents, invoice.currency) : "—"} />
              <ResultStat
                label={discountType === "percent" && totals ? `Discount ${discountValue}%` : "Discount"}
                value={totals ? formatMoney(-totals.discountCents, invoice.currency) : "—"}
              />
              <ResultStat label={`Tax ${taxRate || 0}%`} value={totals ? formatMoney(totals.taxCents, invoice.currency) : "—"} />
              <ResultStat label={kind === "invoice" ? "Total due" : "Total"} value={totals ? formatMoney(totals.totalCents, invoice.currency) : "—"} />
            </div>

            <InvoicePreview invoice={invoice} totals={totals} />

            <ActionButton type="button" onClick={() => void download()} disabled={busy}>
              <Download size={16} /> {busy ? "Building PDF…" : "Download PDF"}
            </ActionButton>
            <Notice tone="neutral" title="Nothing is uploaded." body="The invoice is built in this browser. Your details never leave this tab." />
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={errors.length > 0 ? "Waiting for fixes" : "Invoices stay in this browser"}
        tone={errors.length > 0 ? "warn" : "pass"}
        trailing="⌘↵ download"
        items={[
          { level: "info", label: "Items", detail: String(items.length) },
          ...(totals ? [{ level: "pass" as const, label: "Total", detail: formatMoney(totals.totalCents, invoice.currency) }] : []),
        ]}
      />
    </ToolCard>
  );
}

function PartyFields({
  label,
  party,
  onChange,
  prefix,
}: {
  label: string;
  party: InvoiceParty;
  onChange: (patch: Partial<InvoiceParty>) => void;
  prefix: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[12.5px] font-medium text-fg2">{label}</span>
      <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
        <FieldRow label="Name" htmlFor={`${prefix}-name`}>
          <TextInput id={`${prefix}-name`} value={party.name} placeholder="Company name" onChange={(event) => onChange({ name: event.target.value })} />
        </FieldRow>
        <FieldRow label="Email" htmlFor={`${prefix}-email`}>
          <TextInput id={`${prefix}-email`} type="email" value={party.email} placeholder="billing@example.com" onChange={(event) => onChange({ email: event.target.value })} />
        </FieldRow>
      </div>
      <FieldRow label="Address" htmlFor={`${prefix}-address`}>
        <TextArea id={`${prefix}-address`} rows={2} value={party.address} placeholder="Street, city, country" onChange={(event) => onChange({ address: event.target.value })} />
      </FieldRow>
    </div>
  );
}

function InvoicePreview({
  invoice,
  totals,
}: {
  invoice: InvoiceData;
  totals: { subtotalCents: number; discountCents: number; taxCents: number; totalCents: number; currency: string } | null;
}) {
  const title = invoice.kind === "invoice" ? "INVOICE" : "QUOTE";
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface" aria-label="Invoice preview">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <div className="text-[15px] font-bold tracking-wide">{title}</div>
          <div className="text-[12px] text-muted-foreground">#{invoice.number || "—"}</div>
        </div>
        <div className="text-right text-[11.5px] text-muted-foreground">
          <div>Issued {invoice.issueDate || "—"}</div>
          <div>Due {invoice.dueDate || "—"}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 py-3 text-[12px]">
        <div>
          <div className="text-[10.5px] font-semibold tracking-wide text-faint uppercase">From</div>
          <div className="font-medium">{invoice.from.name || "—"}</div>
          {invoice.from.address ? <div className="text-muted-foreground whitespace-pre-line">{invoice.from.address}</div> : null}
        </div>
        <div>
          <div className="text-[10.5px] font-semibold tracking-wide text-faint uppercase">Bill to</div>
          <div className="font-medium">{invoice.to.name || "—"}</div>
          {invoice.to.address ? <div className="text-muted-foreground whitespace-pre-line">{invoice.to.address}</div> : null}
        </div>
      </div>
      <div className="border-t border-border px-4 py-2 text-[12px]">
        {invoice.items.length === 0 ? (
          <div className="py-2 text-muted-foreground">No items yet.</div>
        ) : (
          invoice.items.map((item, index) => (
            <div key={index} className="flex items-baseline justify-between gap-3 border-t border-border/60 py-1.5 first:border-t-0">
              <span className="min-w-0 truncate">{item.description || <span className="text-muted-foreground">Untitled item</span>}</span>
              <span className="shrink-0 text-muted-foreground">
                {Number.isFinite(item.quantity) ? item.quantity : "?"} × {Number.isFinite(item.rate) ? formatMoney(Math.round(item.rate * 100), invoice.currency) : "?"}
              </span>
            </div>
          ))
        )}
      </div>
      <div className="border-t border-border px-4 py-2 text-[12px]">
        <div className="flex justify-between py-0.5 text-muted-foreground">
          <span>Subtotal</span>
          <span>{totals ? formatMoney(totals.subtotalCents, invoice.currency) : "—"}</span>
        </div>
        <div className="flex justify-between py-0.5 text-muted-foreground">
          <span>Discount</span>
          <span>{totals ? formatMoney(-totals.discountCents, invoice.currency) : "—"}</span>
        </div>
        <div className="flex justify-between py-0.5 text-muted-foreground">
          <span>Tax</span>
          <span>{totals ? formatMoney(totals.taxCents, invoice.currency) : "—"}</span>
        </div>
        <div className="flex justify-between py-1 text-[14px] font-bold">
          <span>{invoice.kind === "invoice" ? "Total due" : "Total"}</span>
          <span>{totals ? formatMoney(totals.totalCents, invoice.currency) : "—"}</span>
        </div>
      </div>
      {invoice.notes ? (
        <div className="border-t border-border px-4 py-2 text-[11.5px] text-muted-foreground whitespace-pre-line">{invoice.notes}</div>
      ) : null}
    </div>
  );
}
