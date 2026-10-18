import Decimal from "decimal.js";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export type ScheduleRow = {
  month: number;
  payment: string;
  principal: string;
  interest: string;
  extra: string;
  balance: string;
};

export type EmiResult = {
  emi: string;
  totalPayment: string;
  totalInterest: string;
  totalPrincipal: string;
  payoffMonths: number;
  schedule: ScheduleRow[];
  csv: string;
};

const maxMonths = 600;

export function calculateEmi(principalText: string, annualRateText: string, months: number, extraText: string): EmiResult | { error: string } {
  const principal = amount(principalText, "Principal");
  if (typeof principal === "string") return { error: principal };
  const annualRate = amount(annualRateText, "Annual rate");
  if (typeof annualRate === "string") return { error: annualRate };
  const extra = amount(extraText, "Extra payment");
  if (typeof extra === "string") return { error: extra };
  if (principal.lte(0)) return { error: "Principal must be greater than zero." };
  if (annualRate.lt(0)) return { error: "Annual rate cannot be negative." };
  if (!Number.isInteger(months) || months < 1 || months > maxMonths) return { error: `Term must be a whole number of months from 1 to ${maxMonths}.` };
  if (extra.lt(0)) return { error: "Extra payment cannot be negative." };

  const monthlyRate = annualRate.div(100).div(12);
  const installment = monthlyPayment(principal, monthlyRate, months);
  if (installment.lte(0)) return { error: "The payment rounds to zero. Shorten the term or raise the principal." };

  const rows: ScheduleRow[] = [];
  let balance = principal;
  let totalPayment = new Decimal(0);
  let totalInterest = new Decimal(0);
  let totalPrincipal = new Decimal(0);

  for (let month = 1; month <= months && balance.gt(0); month += 1) {
    const interest = money(balance.mul(monthlyRate));
    const owed = balance.plus(interest);
    const finalMonth = month === months;
    const regular = finalMonth ? owed : Decimal.min(installment, owed);
    const room = balance.minus(regular.minus(interest));
    const extraApplied = room.gt(0) ? Decimal.min(extra, room) : new Decimal(0);
    const payment = money(regular.plus(extraApplied));
    const principalPaid = money(payment.minus(interest));
    if (!finalMonth && principalPaid.lte(0)) return { error: "The payment does not reduce the balance. Shorten the term or lower the rate." };
    balance = money(balance.minus(principalPaid));
    if (balance.lt(0)) balance = new Decimal(0);
    totalPayment = totalPayment.plus(payment);
    totalInterest = totalInterest.plus(interest);
    totalPrincipal = totalPrincipal.plus(principalPaid);
    rows.push({
      month,
      payment: fixed(payment),
      principal: fixed(principalPaid),
      interest: fixed(interest),
      extra: fixed(extraApplied),
      balance: fixed(balance),
    });
  }

  if (balance.gt(0)) return { error: "The schedule did not pay off the loan. Check the rate and the extra payment." };

  return {
    emi: fixed(installment),
    totalPayment: fixed(totalPayment),
    totalInterest: fixed(totalInterest),
    totalPrincipal: fixed(totalPrincipal),
    payoffMonths: rows.length,
    schedule: rows,
    csv: toCsv(rows),
  };
}

function monthlyPayment(principal: Decimal, monthlyRate: Decimal, months: number) {
  if (monthlyRate.isZero()) return money(principal.div(months));
  const factor = monthlyRate.plus(1).pow(months);
  return money(principal.mul(monthlyRate).mul(factor).div(factor.minus(1)));
}

function amount(value: string, label: string): Decimal | string {
  const text = value.trim();
  if (!/^\d+(\.\d+)?$/.test(text)) return `${label} must be a positive number.`;
  return new Decimal(text);
}

function money(value: Decimal) {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

function fixed(value: Decimal) {
  return value.toFixed(2);
}

function toCsv(rows: ScheduleRow[]) {
  const header = "month,payment,principal,interest,extra,balance";
  const lines = rows.map((row) => [row.month, row.payment, row.principal, row.interest, row.extra, row.balance].join(","));
  return [header, ...lines].join("\n");
}
