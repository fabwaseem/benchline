"use client";

import { Network } from "lucide-react";
import { useMemo, useState } from "react";
import { TextArea, TextInput } from "@/components/kit/controls";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Panel, ToolShell } from "@/components/kit/tool-shell";
import { calculateCidr } from "@/tools/ip-cidr-calculator/lib/cidr";

export default function CidrTool() {
  const [cidr, setCidr] = useState("192.168.1.0/24");
  const [contains, setContains] = useState("");
  const [split, setSplit] = useState("");
  const [merge, setMerge] = useState("");
  const result = useMemo(() => {
    const splitPrefix = split.trim() === "" ? undefined : Number(split);
    const extra = merge.split(/\n/).map((line) => line.trim()).filter(Boolean);
    return calculateCidr({ cidr, contains, splitPrefix, merge: extra });
  }, [cidr, contains, merge, split]);
  const error = "error" in result ? result.error : "";

  return (
    <ToolShell
      runsLocally
      layout="split"
      status={
        <>
          <span className={error ? "dot dot-warn" : "dot"} />
          <span>{error || ("error" in result ? "" : `${result.summary.network} · ${result.summary.usableHosts} hosts`)}</span>
        </>
      }
      input={
        <Panel title="Network">
          <FieldRow label="CIDR" htmlFor="cidr" help="192.168.1.10/24 or 10.0.0.9 255.255.255.0" error={error || undefined}>
            <TextInput id="cidr" value={cidr} className="font-mono" aria-invalid={Boolean(error) || undefined} onChange={(event) => setCidr(event.target.value)} />
          </FieldRow>
          <FieldRow label="Contains" htmlFor="cidr-host" help="Leave blank to skip the membership test.">
            <TextInput id="cidr-host" value={contains} className="font-mono" onChange={(event) => setContains(event.target.value)} />
          </FieldRow>
          <FieldRow label="Split into prefix" htmlFor="cidr-split" help="Longer than the network, at most 256 pieces.">
            <TextInput id="cidr-split" inputMode="numeric" value={split} className="font-mono" onChange={(event) => setSplit(event.target.value)} />
          </FieldRow>
          <FieldRow label="Merge with" htmlFor="cidr-merge" help="One CIDR per line. Combined with the network above.">
            <TextArea id="cidr-merge" value={merge} className="min-h-24 font-mono" onChange={(event) => setMerge(event.target.value)} />
          </FieldRow>
        </Panel>
      }
      output={
        <Panel title="Range">
          {"error" in result ? (
            <EmptyState art={<Network size={22} />} title="Enter a CIDR" hint="IPv4 and IPv6. Host bits are masked off." />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <ResultStat label="Network" value={result.summary.network} />
                <ResultStat label="Prefix" value={`/${result.summary.prefix}`} />
                <ResultStat label="Netmask" value={result.summary.netmask} />
                <ResultStat label="Wildcard" value={result.summary.wildcard} />
                <ResultStat label="First host" value={result.summary.firstHost} />
                <ResultStat label="Last host" value={result.summary.lastHost} />
                <ResultStat label="Addresses" value={result.summary.addressCount} />
                <ResultStat label="Usable" value={result.summary.usableHosts} hint={result.summary.broadcast ? `Broadcast ${result.summary.broadcast}` : "IPv6 has no broadcast"} />
              </div>
              {result.containsDetail ? <Notice tone={result.contains ? "ok" : "warn"} title={result.contains ? "Inside" : "Outside"} body={result.containsDetail} /> : null}
              {result.split.length > 0 ? (
                <div>
                  <p className="mb-1 text-[12px] text-muted-foreground">{result.splitCount} networks</p>
                  <ul className="font-mono text-[13px]">
                    {result.split.map((item) => <li key={item} className="border-t border-border py-1">{item}</li>)}
                  </ul>
                </div>
              ) : null}
              {result.merged.length > 0 ? (
                <div>
                  <p className="mb-1 text-[12px] text-muted-foreground">Merged</p>
                  <ul className="font-mono text-[13px]">
                    {result.merged.map((item) => <li key={item} className="border-t border-border py-1">{item}</li>)}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </Panel>
      }
    />
  );
}
