"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Copy } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { Input } from "@/components/ui/input";
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

  return (
    <ToolShell
      runsLocally
      layout="split+inspector"
      flow="band"
      tabs={<ToolTabs label="Direction" value={tab} onChange={setTab} options={[{ value: "to-date", label: "Epoch to date" }, { value: "to-epoch", label: "Date to epoch" }]} />}
      actions={<InkButton icon={<Copy size={15} />} onClick={() => copyValue && void navigator.clipboard.writeText(copyValue).then(() => toast.success("ISO time copied"))}>Copy ISO</InkButton>}
      status={
        <>
          <span className={"error" in result ? "dot dot-warn" : "dot"} />
          <span>{"error" in result ? result.error : `${result.timeZone} ${result.offset === "Z" ? "UTC" : result.offset}`}</span>
          <span className="ml-auto hidden font-mono min-[700px]:inline">{now === null ? "" : `${Math.trunc(now / 1000)} now`}</span>
        </>
      }
      input={
        <Panel title={tab === "to-date" ? "Timestamp" : "Calendar time"}>
          {tab === "to-date" ? (
            <>
              <FieldRow label="Timestamp or date" htmlFor="epoch" error={"error" in result ? result.error : undefined} help="A number, ISO-8601, RFC 2822, or now.">
                <Input id="epoch" value={raw} onChange={(event) => setRaw(event.target.value)} className="font-mono" aria-invalid={"error" in result} />
              </FieldRow>
              <Segmented label="Unit" value={unit} onChange={setUnit} options={units} />
              <button type="button" className="chip" onClick={() => now !== null && setRaw(String(Math.trunc(now / 1000)))}>Use current time</button>
            </>
          ) : (
            <>
              <FieldRow label="Date" htmlFor="epoch-date">
                <Input id="epoch-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </FieldRow>
              <FieldRow label="Time" htmlFor="epoch-time" help="Interpreted as wall time in the selected zone.">
                <Input id="epoch-time" type="time" step={1} value={time} onChange={(event) => setTime(event.target.value)} />
              </FieldRow>
            </>
          )}
          <FieldRow label="Time zone" htmlFor="epoch-zone" help="Any IANA zone. A date with no offset uses this zone.">
            <Input id="epoch-zone" list="epoch-zones" value={zone} onChange={(event) => setZone(event.target.value)} className="font-mono" />
            <datalist id="epoch-zones">
              {zones.map((item) => <option key={item} value={item} />)}
            </datalist>
          </FieldRow>
        </Panel>
      }
      output={
        <div aria-live="polite">
          {"error" in result ? (
            <Panel>
              <Notice tone="bad" role="alert" title={result.error} />
              <EmptyState art={<Clock size={22} />} title="No instant" hint="Check the timestamp, the date, and the time zone." />
            </Panel>
          ) : (
            <Panel title="Result">
              <div className="grid grid-cols-2 gap-2">
                <ResultStat label="Seconds" value={result.seconds} />
                <ResultStat label="Milliseconds" value={result.milliseconds} />
              </div>
              <p className="font-mono text-[13px] break-all">{result.isoLocal}</p>
              <p className="font-mono text-[13px] text-muted-foreground break-all">{result.isoUtc}</p>
              <p className="text-sm">{result.weekday} · {result.rfc2822}</p>
              {relative ? <p className="text-sm text-muted-foreground">{relative}</p> : null}
              {result.alternateIsoUtc ? <Notice tone="warn" title="This local time happens twice." body={`The earlier instant is shown. The later one is ${result.alternateIsoUtc}.`} /> : null}
            </Panel>
          )}
        </div>
      }
      inspector={
        <Panel title="Other zones">
          {"error" in result ? <p className="text-sm text-muted-foreground">A valid instant shows the same moment in other zones.</p> : (
            <ul>
              {commonTimeZones.map((item) => {
                const local = convertToDate(String(result.ms), item, "ms", 0);
                if ("error" in local) return null;
                return (
                  <li key={item} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-border py-2 text-[12px]">
                    <span className="font-mono text-muted-foreground">{item}</span>
                    <span className="font-mono">{local.isoLocal.replace("T", " ")}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      }
    />
  );
}
