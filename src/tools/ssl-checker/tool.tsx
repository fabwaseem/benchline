"use client";

import { useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { ActionButton, TextInput } from "@/components/kit/controls";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { SkeletonRows } from "@/components/kit/skeleton-rows";
import { Pane, ResultsTable, ScoreCard, StatusStrip, ToolCard, ToolPanes } from "@/components/kit/shell";
import { Truncate } from "@/components/kit/shell/truncate";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
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

const GRADE_SCORE: Record<string, number> = { A: 96, B: 80, C: 64, D: 42, F: 18 };

export default function SslTool() {
  const [host, setHost] = useState("");
  const [result, setResult] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const hostRef = useRef<HTMLInputElement>(null);

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

  function cancel() {
    abortRef.current?.abort();
    setBusy(false);
    hostRef.current?.focus();
  }

  useWorkbenchKeys({ onEnter: () => void run(), onEscape: cancel });
  const days = result?.daysRemaining;
  const note = busy ? "Opening TLS…" : error || (result ? `${result.protocol || "TLS"} · grade ${result.grade}` : "Waiting for a hostname");

  return (
    <ToolCard>
      <div className="flex flex-col gap-3 border-b border-border p-3 min-[700px]:flex-row min-[700px]:items-end">
        <FieldRow label="Hostname" htmlFor="ssl-host" className="min-w-0 flex-1" help="Port 443 only. Private addresses are refused." error={error || undefined}>
          <TextInput ref={hostRef} id="ssl-host" value={host} autoFocus className="font-mono" aria-invalid={Boolean(error) || undefined} onChange={(event) => setHost(event.target.value)} />
        </FieldRow>
        <div className="flex flex-wrap gap-2">
          <ActionButton type="button" className="btn btn-ink" disabled={!host.trim() || busy} onClick={() => void run()}>Check certificate</ActionButton>
          {busy ? <ActionButton type="button" variant="outline" onClick={cancel}>Cancel</ActionButton> : null}
        </div>
      </div>
      <ToolPanes ratio="35/65">
        <Pane label="Certificate">
          {busy ? <SkeletonRows /> : result ? (
            <>
              <ScoreCard
                score={GRADE_SCORE[result.grade] ?? 0}
                verdict={days === null ? `Grade ${result.grade}` : `${days} days left`}
                caption={result.authorized ? "Trusted chain" : "Not trusted"}
                stats={[
                  { label: "Subject", value: result.subject || "—" },
                  { label: "Issuer", value: result.issuer || "—" },
                ]}
              />
              <Truncate value={result.fingerprint} className="font-mono text-[12px] text-muted-foreground" />
              <ul className="text-[13px]">
                {result.sans.map((name) => (
                  <li key={name} className="truncate border-t border-border py-2 font-mono" title={name}>{name}</li>
                ))}
              </ul>
              <ul className="text-[13px]">
                {result.chain.map((link, index) => (
                  <li key={`${link.subject}-${index}`} className="border-t border-border py-2">
                    <Truncate value={link.subject} className="font-medium" />
                    <Truncate value={link.issuer} className="text-muted-foreground" />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyState art={<ShieldCheck size={22} />} title={error || "The certificate shows up here"} hint="Expiry, names, protocol, and the chain from a TLS handshake on port 443." />
          )}
          {error ? <Notice tone="bad" role="alert" title="The check failed." body={error} /> : null}
        </Pane>
        <Pane label="Checks" padded={false} scroll={false} bodyClassName="flex min-h-[280px] flex-col">
          <div aria-live="polite" className="flex min-h-0 flex-1 flex-col">
            {result ? <ResultsTable rows={result.checks} empty="No certificate checks." /> : <p className="px-3 py-6 text-sm text-muted-foreground">{busy ? "Opening TLS…" : "Nothing checked yet."}</p>}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={note} tone={error ? "warn" : result ? (result.grade === "A" || result.grade === "B" ? "pass" : "warn") : "info"} trailing="⌘↵ check · esc cancel" />
    </ToolCard>
  );
}
