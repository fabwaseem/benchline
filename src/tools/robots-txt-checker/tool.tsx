"use client";

import { useMemo, useRef, useState } from "react";
import { Copy, Shield } from "lucide-react";
import { toast } from "sonner";
import { CheckRows } from "@/components/kit/check-row";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { SkeletonRows } from "@/components/kit/skeleton-rows";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { postTool } from "@/lib/post-tool";
import { parseRobots, robotsIssues, type RobotsDocument } from "@/lib/robots";

type Result = {
  finalUrl: string;
  status: number;
  contentType?: string;
  bytes?: number;
  text: string;
  document: RobotsDocument;
  issues: { level: "pass" | "warn" | "fail" | "info"; label: string; detail: string }[];
};

export default function RobotsTool() {
  const [mode, setMode] = useState<"url" | "paste">("url");
  const [url, setUrl] = useState("");
  const [pasted, setPasted] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const local = useMemo(() => {
    const document = parseRobots(pasted);
    return { document, issues: robotsIssues(document) };
  }, [pasted]);
  const active = mode === "paste" && pasted.trim()
    ? { text: pasted, ...local, finalUrl: "Pasted file", status: 0, contentType: "text/plain", bytes: new TextEncoder().encode(pasted).length }
    : mode === "url"
      ? result
      : null;
  const blocked = /private|loopback/i.test(error);
  const html = active?.issues.some((issue) => issue.label === "Response is HTML") ?? false;
  const fails = active?.issues.filter((issue) => issue.level === "fail").length ?? 0;
  const report = active
    ? [active.finalUrl, ...active.issues.map((issue) => `${issue.level.toUpperCase()} ${issue.label}: ${issue.detail}`)].join("\n")
    : "";

  async function run() {
    if (mode === "paste" || !url.trim()) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError("");
    try {
      setResult(await postTool<Result>("/api/tools/robots-txt", { url }, controller.signal));
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setResult(null);
      const message = cause instanceof Error ? cause.message : "The check failed.";
      setError(/private address/i.test(message) ? "Private addresses are refused." : message);
    } finally {
      if (abortRef.current === controller) setBusy(false);
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setBusy(false);
    urlRef.current?.focus();
  }

  useWorkbenchKeys({
    onEnter: () => void run(),
    onCopy: () => {
      if (!report) return;
      void navigator.clipboard.writeText(report).then(() => toast.success("Report copied"));
    },
  });

  const status = mode === "paste"
    ? pasted.trim()
      ? `Pasted file · audited locally${fails ? ` · ${fails} fails` : ""}`
      : "Waiting for a file"
    : busy
      ? `GET ${url}/robots.txt…`
      : blocked
        ? "Refused · private address"
        : result
          ? `GET ${result.finalUrl} → ${result.status} ${result.contentType || ""} · ${(result.bytes ?? result.text.length).toLocaleString("en-US")} B`
          : "Waiting for a domain";

  return (
    <ToolShell
      runsLocally={mode === "paste"}
      busy={busy}
      layout="split+inspector"
      flow="band"
      columns="min-[1280px]:grid-cols-[360px_minmax(0,1fr)_340px]"
      tabs={<ToolTabs label="Mode" value="audit" onChange={() => {}} options={[{ value: "audit", label: "Audit" }]} />}
      actions={busy ? <Button type="button" variant="outline" className="h-[30px]" onClick={cancel}>Cancel</Button> : <InkButton disabled={!report} icon={<Copy size={15} />} onClick={() => void navigator.clipboard.writeText(report).then(() => toast.success("Report copied"))}>Copy report</InkButton>}
      status={
        <>
          <span className={fails || error ? "dot dot-warn" : "dot"} />
          <span>{status}</span>
          <span className="ml-auto hidden min-[700px]:inline">⌘↵ fetch · ⌘⇧C copy report</span>
        </>
      }
      input={
        <Panel title="Source">
          <p className="text-[12.5px] text-muted-foreground">Allow and Disallow paths, sitemap links, and the mistakes that change what crawlers fetch.</p>
          <Segmented label="Source" value={mode} onChange={setMode} options={[{ value: "url", label: "Fetch URL" }, { value: "paste", label: "Paste file" }]} />
          {mode === "url" ? (
            <FieldRow label="Domain or robots.txt URL" htmlFor="robots-url" help="A bare domain is fetched at /robots.txt." error={blocked ? error : undefined}>
              <Input ref={urlRef} id="robots-url" value={url} autoFocus aria-invalid={blocked || undefined} onChange={(event) => setUrl(event.target.value)} className="max-[699px]:h-11" />
            </FieldRow>
          ) : (
            <FieldRow label="robots.txt" htmlFor="robots-paste" help="Audited in the browser. Nothing is sent.">
              <Textarea id="robots-paste" value={pasted} onChange={(event) => setPasted(event.target.value)} className="min-h-48 font-mono text-xs" />
            </FieldRow>
          )}
          {mode === "url" ? (
            <Button type="button" className="btn btn-ink h-11" aria-busy={busy} disabled={!url.trim() || busy} onClick={() => void run()}>Fetch</Button>
          ) : null}
          {mode === "url" && result?.text ? <CodeOutput code={result.text} filename="robots.txt" label="Fetched file" /> : null}
        </Panel>
      }
      output={
        <div aria-live="polite" className="min-h-[240px]">
          {busy ? <SkeletonRows /> : active ? (
            <div className="flex flex-col">
              {html ? <Notice className="m-4" tone="bad" role="alert" title="This is not a robots.txt file." body="The URL returned a web page instead of a robots.txt file." /> : null}
              {active.document.groups.map((group) => (
                <section key={group.agents.join(",") || "group"} className="border-b border-border px-4 py-3">
                  <p className="font-mono text-[12.5px] font-medium">User-agent: {group.agents.join(", ")}</p>
                  {group.crawlDelay ? <p className="mt-1 font-mono text-[12px] text-muted-foreground">Crawl-delay: {group.crawlDelay}</p> : null}
                  {group.allow.map((rule) => <p key={`a-${rule}`} className="mt-1 font-mono text-[12.5px] text-status-ok">Allow: {rule || "—"}</p>)}
                  {group.disallow.map((rule) => <p key={`d-${rule}`} className="mt-1 font-mono text-[12.5px] text-status-bad">Disallow: {rule || "—"}</p>)}
                  {group.allow.length === 0 && group.disallow.length === 0 ? <p className="mt-1 text-[12.5px] text-muted-foreground">No path rules.</p> : null}
                </section>
              ))}
              {active.document.sitemaps.map((sitemap) => (
                <p key={sitemap} className="px-4 py-2 font-mono text-[12.5px]">Sitemap: {sitemap}</p>
              ))}
            </div>
          ) : (
            <EmptyState art={<Shield size={22} />} title={error || "Rules show up here"} hint="Allow and Disallow paths, sitemap links, and the mistakes that change what crawlers fetch." />
          )}
        </div>
      }
      inspector={
        <Panel title="Checks">
          {active ? (
            <>
              <CheckRows rows={active.issues} />
              <div className="grid grid-cols-2 gap-2 px-4">
                <ResultStat variant="well" label="Groups" value={String(active.document.groups.length)} />
                <ResultStat variant="well" label="Sitemaps" value={String(active.document.sitemaps.length)} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{busy ? "Fetching robots.txt…" : "Nothing audited yet."}</p>
          )}
        </Panel>
      }
    />
  );
}
