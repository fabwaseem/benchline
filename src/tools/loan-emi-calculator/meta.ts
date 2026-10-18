import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "loan-emi-calculator",
  name: "Loan EMI calculator",
  tagline: "A monthly installment and the full amortization table, rounded to the cent.",
  description:
    "Free loan, EMI, and mortgage calculator. Enter principal, annual rate, and term. See the installment, total interest, and every payment. Extra monthly payments shorten the schedule. Amounts use decimal rounding, not binary floats.",
  category: "finance",
  tags: ["loan", "emi", "mortgage"],
  keywords: ["emi calculator", "loan calculator", "mortgage calculator", "amortization schedule"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Landmark",
  related: ["percentage-calculator", "date-difference", "unit-converter", "unix-timestamp"],
  faqs: [
    { q: "How is the installment rounded?", a: "The monthly rate is annual rate divided by 12. The installment is rounded half up to cents. The last payment is adjusted so the balance ends at zero." },
    { q: "What does an extra payment do?", a: "It is applied to principal after the regular installment, and it is capped so the balance does not go negative. The term gets shorter and the interest falls." },
    { q: "Is this a lender quote?", a: "No. It is the standard reducing-balance formula. Fees, insurance, and a lender's own rounding are not included." },
  ],
  seo: {
    title: "Loan EMI and mortgage calculator",
    description: "Calculate a loan installment and an amortization schedule with cent rounding and extra payments.",
  },
  howTo: [
    { name: "Enter the loan", text: "Principal, annual interest percent, and the term in years and months." },
    { name: "Add an extra payment", text: "Leave it at zero for the standard schedule, or set a monthly extra that goes to principal." },
    { name: "Read the table", text: "Each row is payment, principal, interest, extra, and the remaining balance. Download the CSV if you need the schedule elsewhere." },
  ],
  inputs: "Principal, annual rate, term in months, and an optional extra monthly payment.",
  outputs: "The installment, totals, an amortization table, and a CSV of that table.",
  runsLocally: true,
  badges: ["Amortization · Cents"],
} satisfies ToolMeta;
