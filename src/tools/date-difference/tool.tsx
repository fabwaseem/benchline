"use client";

import { useMemo, useState } from "react";
import { OptionRow, TextInput, TextArea } from "@/components/kit/controls";
import { CalendarRange } from "lucide-react";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Pane, StatusStrip, ToolCard, ToolPanes } from "@/components/kit/shell";
import { difference } from "@/tools/date-difference/lib/diff";

export default function DateDifferenceTool() {
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-01-31");
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("00:00");
  const [includeEnd, setIncludeEnd] = useState(false);
  const [holidays, setHolidays] = useState("");

  const result = useMemo(
    () => difference({ startDate, endDate, startTime, endTime, includeEnd, holidays }),
    [endDate, endTime, holidays, includeEnd, startDate, startTime],
  );

  const headline = "error" in result ? "" : `${result.sign < 0 ? "−" : ""}${result.years}y ${result.months}m ${result.days}d`;

  const note = "error" in result ? result.error : `${result.countedDays} days counted · ${result.businessDays} business days`;

  return (
    <ToolCard>
      <ToolPanes>
        <Pane label="Dates">
          <div className="grid gap-3 min-[700px]:grid-cols-2">
            <FieldRow label="Start" htmlFor="diff-start">
              <TextInput id="diff-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </FieldRow>
            <FieldRow label="End" htmlFor="diff-end">
              <TextInput id="diff-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </FieldRow>
            <FieldRow label="Start time" htmlFor="diff-start-time">
              <TextInput id="diff-start-time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
            </FieldRow>
            <FieldRow label="End time" htmlFor="diff-end-time">
              <TextInput id="diff-end-time" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
            </FieldRow>
          </div>
          <OptionRow label="Count the end date" checked={includeEnd} onChange={setIncludeEnd} />
          <FieldRow label="Holidays" htmlFor="diff-holidays" help="One YYYY-MM-DD per line. Weekends are already excluded from business days.">
            <TextArea id="diff-holidays" value={holidays} onChange={(event) => setHolidays(event.target.value)} placeholder="2026-12-25" className="min-h-24 font-mono" />
          </FieldRow>
        </Pane>
        <Pane label={"error" in result ? "Span" : "Span"}>
          <div aria-live="polite" className="flex flex-col gap-3">
            {"error" in result ? (
              <>
                <Notice tone="bad" role="alert" title={result.error} />
                <EmptyState art={<CalendarRange size={22} />} title="No span" hint="Use real dates. The end can be earlier than the start." />
              </>
            ) : (
              <>
                <ResultStat variant="well" label="Calendar span" value={headline} hint={result.sign < 0 ? "The end is before the start." : "From the earlier date to the later date."} />
                <div className="grid grid-cols-2 gap-2">
                  <ResultStat label="Elapsed" value={`${result.totalDays}d ${result.hours}h ${result.minutes}m`} hint={`${result.totalHours} hours`} />
                  <ResultStat label="Days counted" value={String(result.countedDays)} hint={includeEnd ? "End date included" : "End date not included"} />
                  <ResultStat label="Weeks" value={`${result.weeks}w ${result.extraDays}d`} />
                  <ResultStat label="Business days" value={String(result.businessDays)} hint={`${result.weekendDays} weekend · ${result.holidayDays} holiday`} />
                </div>
              </>
            )}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={note} tone={"error" in result ? "warn" : "pass"} />
    </ToolCard>
  );
}
