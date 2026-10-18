"use client";

import { useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { ActionButton, TextInput } from "@/components/kit/controls";
import { CheckRows } from "@/components/kit/check-row";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { ResultTable } from "@/components/kit/result-table";
import { SkeletonRows } from "@/components/kit/skeleton-rows";
import { Panel, ToolShell, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { postTool } from "@/lib/post-tool";
import type { CertCheck } from "@/tools/ssl-checker/lib/cert";

type Report = {
  host: string;
  authorized: boolean;
  protocol: string;
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  sans: string[];
  fingerprint: string;
  daysRemaining: number | null;
  grade: string;
  checks: CertCheck[];
  chain: { subject: string; issuer: string; validTo: string }[];
};

export default function SslTool() {
  const [host, setHost] = useState("");
  const [result, setResult] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function run() {
    if (!host.trim()) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError("");
    try {
      setResult(await postTool<Report>("/api/tools/ssl", { host }, controller.signal));
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setResult(null);
      setError(cause instanceof Error ? cause.message : "The check failed.");
    } finally {
      if (abortRef.current === controller) setBusy(false);
    }
  }

  useWorkbenchKeys({ onEnter: () => void run(), onEscape: () => abortRef.current?.abort() });
  const days = result?.daysRemaining;

  return (
    <ToolShell
      runsLocally={false}
      busy={busy}
      layout="split"
      status={
        <>
          <span className={error ? "dot dot-warn" : "dot"} />
          <span>{busy ? "Opening TLS…" : error || (result ? `${result.protocol || "TLS"} · grade ${result.grade}` : "Waiting for a hostname")}</span>
        </>
      }
      input={
        <Panel title="Host">
          <FieldRow label="Hostname" htmlFor="ssl-host" help="Port 443 only. Private addresses are refused." error={error || undefined}>
            <TextInput id="ssl-host" value={host} autoFocus className="font-mono" onChange={(event) => setHost(event.target.value)} />
          </FieldRow>
          <ActionButton disabled={!host.trim() || busy} onClick={() => void run()}>Check certificate</ActionButton>
        </Panel>
      }
      output={
        <Panel title="Certificate">
          {busy ? <SkeletonRows /> : result ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <ResultStat label="Days left" value={days === null ? "—" : String(days)} hint={result.validTo} />
                <ResultStat label="Grade" value={result.grade} hint={result.authorized ? "Trusted chain" : "Not trusted"} />
                <ResultStat label="Subject" value={result.subject || "—"} />
                <ResultStat label="Issuer" value={result.issuer || "—"} />
              </div>
              <p className="font-mono text-[12px] break-all text-muted-foreground">{result.fingerprint}</p>
              <ResultTable
                caption="Names"
                columns={[{ key: "name", label: "Name" }]}
                rows={result.sans.map((name) => ({ key: name, cells: [name] }))}
              />
              <ResultTable
                caption="Chain"
                columns={[{ key: "subject", label: "Subject" }, { key: "issuer", label: "Issuer" }]}
                rows={result.chain.map((link, index) => ({ key: `${link.subject}-${index}`, cells: [link.subject, link.issuer] }))}
              />
              <CheckRows rows={result.checks} />
            </>
          ) : (
            <EmptyState art={<ShieldCheck size={22} />} title={error || "The certificate shows up here"} hint="Expiry, names, protocol, and the chain from a TLS handshake on port 443." />
          )}
          {error ? <Notice tone="bad" role="alert" title="The check failed." body={error} /> : null}
        </Panel>
      }
    />
  );
}
