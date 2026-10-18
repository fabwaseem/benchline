import { z } from "zod";
import { calculateEmi } from "@/tools/loan-emi-calculator/lib/emi";
import type { BenchTool } from "@/lib/mcp/types";

const amount = z.union([z.string(), z.number()]);

export const inputSchema = z.object({
  principal: amount.describe("Amount borrowed, such as 100000."),
  annualRate: amount.describe("Annual interest rate in percent, such as 10."),
  months: z.number().int().min(1).max(600).describe("Term in months."),
  extraMonthly: amount.default(0).describe("Extra principal paid every month."),
});

const row = z.object({
  month: z.number().int(),
  payment: z.string(),
  principal: z.string(),
  interest: z.string(),
  extra: z.string(),
  balance: z.string(),
});

export const outputSchema = z.object({
  emi: z.string(),
  totalPayment: z.string(),
  totalInterest: z.string(),
  totalPrincipal: z.string(),
  payoffMonths: z.number().int(),
  schedule: z.array(row),
  csv: z.string(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const result = calculateEmi(textOf(parsed.principal), textOf(parsed.annualRate), parsed.months, textOf(parsed.extraMonthly));
  if ("error" in result) throw new Error(result.error);
  return outputSchema.parse(result);
}

function textOf(value: string | number) {
  return typeof value === "number" ? String(value) : value;
}

export const tool: BenchTool = {
  slug: "loan-emi-calculator",
  name: "calculate_emi",
  title: "Calculate a loan EMI",
  description: "Calculate a reducing-balance loan installment and its amortization schedule. Money is rounded half up to cents. An optional extra monthly payment reduces principal.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
