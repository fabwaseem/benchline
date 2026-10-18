"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionButton, ChipButton, TextInput } from "@/components/kit/controls";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { commonTimeZones, convertToDate, convertToEpoch, relativeTime, timeZones, wallFromInputs, type UnitChoice } from "@/tools/unix-timestamp/lib/epoch";

const units: { value: UnitChoice; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "s", label: "Seconds" },
  { value: "ms", label: "Milliseconds" },
  { value: "us", label: "Microseconds" },
  { value: "ns", label: "Nanoseconds" },
];

export default function UnixTimestampTool() {
  const [tab, setTab] = useState<"to-date" | "to-epoch">("to-date");
  const [raw, setRaw] = useState("1609459200");
  const [unit, setUnit] = useState<UnitChoice>("auto");
  const [zone, setZone] = useState("UTC");
  const [date, setDate] = useState("2021-01-01");
  const [time, setTime] = useState("00:00:00");
  const [now, setNow] = useState<number | null>(null);
  const [zones, setZones] = useState<string[]>(() => [...commonTimeZones]);

  useEffect(() => {
    const kick = window.setTimeout(() => {
      setNow(Date.now());
      setZones(timeZones());
    }, 0);
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(kick);
      window.clearInterval(id);
    };
  }, []);

  const result = useMemo(() => {
    if (tab === "to-epoch") {
      const wall = wallFromInputs(date, time);
      if ("error" in wall) return wall;
      return convertToEpoch(wall, zone, 0);
    }
    return convertToDate(raw, zone, unit, 0);
  }, [date, raw, tab, time, unit, zone]);

  const relative = now !== null && !("error" in result) ? relativeTime(result.ms, now) : "";
  const copyValue = "error" in result ? "" : result.isoUtc;

  useWorkbenchKeys({
    onCopy: () => {
      if (!copyValue) return;
      void navigator.clipboard.writeText(copyValue).then(() => toast.success("ISO time copied"));
    },
    onEscape: () => {
      setRaw("1609459200");
      setDate("2021-01-01");
      setTime("00:00:00");
      setZone("UTC");
      setUnit("auto");
    },
  });

  const note = "error" in result ? result.error : `${result.timeZone} ${result.offset === "Z" ? "UTC" : result.offset}`;

  return (
    <ToolCard>
      <ToolToolbar
        label="Direction"
        options={[{ value: "to-date", label: "Epoch to date" }, { value: "to-epoch", label: "Date to epoch" }]}
        value={tab}
        onChange={setTab}
        actions={<ActionButton className="btn btn-ink" disabled={!copyValue} onClick={() => void navigator.clipboard.writeText(copyValue).then(() => toast.success("ISO time copied"))}>Copy ISO</ActionButton>}
      />
      <ToolPanes>
        <Pane label={tab === "to-date" ? "Timestamp" : "Calendar time"}>
          {tab === "to-date" ? (
            <>
              <FieldRow label="Timestamp or date" htmlFor="epoch" error={"error" in result ? result.error : undefined} help="A number, ISO-8601, RFC 2822, or now.">
                <TextInput id="epoch" value={raw} onChange={(event) => setRaw(event.target.value)} className="font-mono" aria-invalid={"error" in result} />
              </FieldRow>
              <Segmented label="Unit" value={unit} onChange={setUnit} options={units} />
              <ChipButton onClick={() => now !== null && setRaw(String(Math.trunc(now / 1000)))}>Use current time</ChipButton>
            </>
          ) : (
            <>
              <FieldRow label="Date" htmlFor="epoch-date">
                <TextInput id="epoch-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </FieldRow>
              <FieldRow label="Time" htmlFor="epoch-time" help="Interpreted as wall time in the selected zone.">
                <TextInput id="epoch-time" type="time" step={1} value={time} onChange={(event) => setTime(event.target.value)} />
              </FieldRow>
            </>
          )}
          <FieldRow label="Time zone" htmlFor="epoch-zone" help="Any IANA zone. A date with no offset uses this zone.">
            <TextInput id="epoch-zone" list="epoch-zones" value={zone} onChange={(event) => setZone(event.target.value)} className="font-mono" />
            <datalist id="epoch-zones">
              {zones.map((item) => <option key={item} value={item} />)}
            </datalist>
          </FieldRow>
        </Pane>
        <Pane label="Result">
          <div aria-live="polite" className="flex flex-col gap-3">
            {"error" in result ? (
              <>
                <Notice tone="bad" role="alert" title={result.error} />
                <EmptyState art={<Clock size={22} />} title="No instant" hint="Check the timestamp, the date, and the time zone." />
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <ResultStat label="Seconds" value={result.seconds} />
                  <ResultStat label="Milliseconds" value={result.milliseconds} />
                </div>
                <p className="truncate font-mono text-[13px]" title={result.isoLocal}>{result.isoLocal}</p>
                <p className="truncate font-mono text-[13px] text-muted-foreground" title={result.isoUtc}>{result.isoUtc}</p>
                <p className="truncate text-sm" title={`${result.weekday} · ${result.rfc2822}`}>{result.weekday} · {result.rfc2822}</p>
                {relative ? <p className="text-sm text-muted-foreground">{relative}</p> : null}
                {result.alternateIsoUtc ? <Notice tone="warn" title="This local time happens twice." body={`The earlier instant is shown. The later one is ${result.alternateIsoUtc}.`} /> : null}
                <ul>
                  {commonTimeZones.map((item) => {
                    const local = convertToDate(String(result.ms), item, "ms", 0);
                    if ("error" in local) return null;
                    const shown = local.isoLocal.replace("T", " ");
                    return (
                      <li key={item} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-border py-2 text-[12px]">
                        <span className="truncate font-mono text-muted-foreground" title={item}>{item}</span>
                        <span className="truncate font-mono" title={shown}>{shown}</span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={note} tone={"error" in result ? "warn" : "pass"} trailing={now === null ? undefined : `${Math.trunc(now / 1000)} now`} />
    </ToolCard>
  );
}
