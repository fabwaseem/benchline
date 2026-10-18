"use client";

import { useRef, useState } from "react";
import { Globe } from "lucide-react";
import { ActionButton, ChipButton, OptionRow, TextInput } from "@/components/kit/controls";
import { CheckRows } from "@/components/kit/check-row";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultTable } from "@/components/kit/result-table";
import { Segmented } from "@/components/kit/segmented";
import { SkeletonRows } from "@/components/kit/skeleton-rows";
import { InkButton, Panel, ToolShell, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { postTool } from "@/lib/post-tool";
import { recordTypes, type DmarcSummary, type DnsRecord, type RecordType, type ResolverId, type SpfSummary } from "@/tools/dns-lookup/lib/dns";

type Lookup = {
  name: string;
  resolver: ResolverId;
  records: DnsRecord[];
  queries: { type: RecordType; rcode: string }[];
  spf: SpfSummary | null;
  dmarc: DmarcSummary | null;
};

export default function DnsLookupTool() {
  const [name, setName] = useState("");
  const [resolver, setResolver] = useState<ResolverId>("cloudflare");
  const [types, setTypes] = useState<RecordType[]>([...recordTypes]);
  const [mail, setMail] = useState(true);
  const [result, setResult] = useState<Lookup | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function run() {
    if (!name.trim() || types.length === 0) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError("");
    try {
      setResult(await postTool<Lookup>("/api/tools/dns-lookup", { name, types, resolver, mail }, controller.signal));
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setResult(null);
      setError(cause instanceof Error ? cause.message : "The lookup failed.");
    } finally {
      if (abortRef.current === controller) setBusy(false);
    }
  }

  function toggle(type: RecordType) {
    setTypes((current) => (current.includes(type) ? current.filter((item) => item !== type) : [...current, type]));
  }

  useWorkbenchKeys({ onEnter: () => void run(), onEscape: () => abortRef.current?.abort() });

  return (
    <ToolShell
      runsLocally={false}
      busy={busy}
      layout="split"
      actions={<InkButton disabled={busy} onClick={() => abortRef.current?.abort()}>Cancel</InkButton>}
      status={
        <>
          <span className={error ? "dot dot-warn" : "dot"} />
          <span>{busy ? "Asking the resolver…" : error || (result ? `${result.records.length} records · ${result.resolver}` : "Waiting for a hostname")}</span>
        </>
      }
      input={
        <Panel title="Query">
          <FieldRow label="Hostname" htmlFor="dns-name" help="example.com. Private names are refused." error={/public|hostname/i.test(error) ? error : undefined}>
            <TextInput id="dns-name" value={name} autoFocus className="font-mono" aria-invalid={/public|hostname/i.test(error) || undefined} onChange={(event) => setName(event.target.value)} />
          </FieldRow>
          <Segmented label="Resolver" value={resolver} onChange={setResolver} options={[{ value: "cloudflare", label: "Cloudflare" }, { value: "google", label: "Google" }]} />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Record types">
            {recordTypes.map((type) => (
              <ChipButton key={type} pressed={types.includes(type)} onClick={() => toggle(type)}>{type}</ChipButton>
            ))}
          </div>
          <OptionRow label="SPF and DMARC" hint="Also reads _dmarc." checked={mail} onChange={setMail} />
          <ActionButton disabled={!name.trim() || types.length === 0 || busy} onClick={() => void run()}>Look up</ActionButton>
        </Panel>
      }
      output={
        <Panel title="Answers">
          {busy ? <SkeletonRows /> : result ? (
            <>
              <ResultTable
                caption="DNS records"
                columns={[{ key: "type", label: "Type" }, { key: "name", label: "Name" }, { key: "ttl", label: "TTL" }, { key: "data", label: "Data", className: "font-mono" }]}
                rows={result.records.map((record, index) => ({
                  key: `${record.type}-${index}`,
                  cells: [record.type, record.name, String(record.ttl), record.data],
                }))}
              />
              {result.records.length === 0 ? <p className="text-sm text-muted-foreground">No answers in the selected types.</p> : null}
              <CheckRows
                rows={[
                  ...result.queries.map((query) => ({
                    level: query.rcode === "NOERROR" ? "pass" as const : query.rcode === "NXDOMAIN" ? "warn" as const : "fail" as const,
                    label: query.type,
                    detail: query.rcode,
                  })),
                  { level: result.spf ? "pass" : "info", label: "SPF", detail: result.spf ? `${result.spf.raw} · all ${result.spf.all}` : "No v=spf1 TXT record." },
                  { level: result.dmarc ? "pass" : "info", label: "DMARC", detail: result.dmarc ? `p=${result.dmarc.policy || "none"}${result.dmarc.rua ? ` · ${result.dmarc.rua}` : ""}` : "No v=DMARC1 record at _dmarc." },
                ]}
              />
            </>
          ) : (
            <EmptyState art={<Globe size={22} />} title={error || "Records show up here"} hint="A, AAAA, MX, TXT, CNAME, and CAA, plus a reading of SPF and DMARC." />
          )}
          {error && result === null && !/public|hostname/i.test(error) ? <Notice tone="bad" role="alert" title="The lookup failed." body={error} /> : null}
        </Panel>
      }
    />
  );
}
