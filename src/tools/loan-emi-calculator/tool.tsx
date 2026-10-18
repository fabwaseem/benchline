"use client";

import { useMemo, useState } from "react";
import { Landmark } from "lucide-react";
import { TextInput } from "@/components/kit/controls";
import { DownloadButton } from "@/components/kit/download-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { calculateEmi } from "@/tools/loan-emi-calculator/lib/emi";

export default function LoanEmiTool() {
  const [principal, setPrincipal] = useState("100000");
  const [rate, setRate] = useState("10");
  const [years, setYears] = useState("1");
  const [months, setMonths] = useState("0");
  const [extra, setExtra] = useState("0");
  const term = whole(years) * 12 + whole(months);
  const result = useMemo(() => calculateEmi(principal, rate, term, extra || "0"), [extra, principal, rate, term]);
  const failed = "error" in result;

  return (
    <ToolCard>
      <ToolToolbar
        actions={failed ? null : <DownloadButton filename="amortization.csv" content={result.csv} mime="text/csv" label="Download CSV" />}
      />
      <ToolPanes ratio="40/60">
        <Pane label="Loan">
          <FieldRow label="Principal" htmlFor="emi-principal">
            <TextInput id="emi-principal" inputMode="decimal" value={principal} onChange={(event) => setPrincipal(event.target.value)} />
          </FieldRow>
          <FieldRow label="Annual rate (%)" htmlFor="emi-rate">
            <TextInput id="emi-rate" inputMode="decimal" value={rate} onChange={(event) => setRate(event.target.value)} />
          </FieldRow>
          <FieldRow label="Years" htmlFor="emi-years">
            <TextInput id="emi-years" inputMode="numeric" value={years} onChange={(event) => setYears(event.target.value)} />
          </FieldRow>
          <FieldRow label="Extra months" htmlFor="emi-months" help="Added to the years. 1 year and 6 months is an 18 month term.">
            <TextInput id="emi-months" inputMode="numeric" value={months} onChange={(event) => setMonths(event.target.value)} />
          </FieldRow>
          <FieldRow label="Extra payment each month" htmlFor="emi-extra" help="Applied to principal after the regular installment.">
            <TextInput id="emi-extra" inputMode="decimal" value={extra} onChange={(event) => setExtra(event.target.value)} />
          </FieldRow>
        </Pane>
        <Pane label="Schedule">
          <div aria-live="polite" className="flex min-h-0 flex-col gap-3">
            {failed ? (
              <>
                <Notice tone="bad" role="alert" title={result.error} />
                <EmptyState art={<Landmark size={22} />} title="No schedule" hint="Use a principal above zero and a term of 1 to 600 months." />
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <ResultStat variant="well" label="EMI" value={result.emi} hint="Rounded half up to cents" />
                  <ResultStat label="Payoff" value={`${result.payoffMonths} mo`} hint={result.payoffMonths === term ? "Full term" : "Shorter than the term"} />
                  <ResultStat label="Total payment" value={result.totalPayment} />
                  <ResultStat label="Total interest" value={result.totalInterest} />
                </div>
                <div className="min-w-0 overflow-x-auto rounded-lg border border-border">
                  <table className="w-full border-collapse text-left text-[12.5px]">
                    <thead className="sticky top-0 bg-surface text-muted-foreground">
                      <tr>
                        {["Month", "Payment", "Principal", "Interest", "Extra", "Balance"].map((heading) => (
                          <th key={heading} scope="col" className="border-b border-border px-3 py-2 font-medium whitespace-nowrap">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="font-mono tabular-nums">
                      {result.schedule.map((row) => (
                        <tr key={row.month} className="border-b border-border last:border-b-0">
                          <td className="px-3 py-1.5 whitespace-nowrap">{row.month}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap">{row.payment}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap">{row.principal}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap">{row.interest}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap">{row.extra}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap">{row.balance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={failed ? result.error : `${result.payoffMonths} payments · EMI ${result.emi}`} tone={failed ? "fail" : "pass"} />
    </ToolCard>
  );
}

function whole(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.trunc(parsed);
}
