"use client";

import { useMemo, useRef, useState } from "react";
import { ActionButton, TextInput, TextArea } from "@/components/kit/controls";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { SkeletonRows } from "@/components/kit/skeleton-rows";
import { Pane, ResultsTable, ScoreCard, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
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
      ? `Pasted file${fails ? ` · ${fails} fails` : ""}`
      : "Waiting for a file"
    : busy
      ? `GET ${url}/robots.txt…`
      : blocked
        ? "Refused · private address"
        : result
          ? `GET ${result.finalUrl} → ${result.status} ${result.contentType || ""} · ${(result.bytes ?? result.text.length).toLocaleString("en-US")} B`
          : "Waiting for a domain";

  return (
    <ToolCard>
      <ToolToolbar
        label="Source"
        options={[{ value: "url" as const, label: "Fetch URL" }, { value: "paste" as const, label: "Paste file" }]}
        value={mode}
        onChange={setMode}
        actions={
          busy ? (
            <ActionButton type="button" variant="outline" onClick={cancel}>Cancel</ActionButton>
          ) : (
            <ActionButton type="button" className="btn btn-ink" disabled={!report} onClick={() => void navigator.clipboard.writeText(report).then(() => toast.success("Report copied"))}>Copy report</ActionButton>
          )
        }
      />
      <div className="flex flex-col gap-3 border-b border-border p-3">
        <p className="text-[12.5px] text-muted-foreground">Allow and Disallow paths, sitemap links, and the mistakes that change what crawlers fetch.</p>
        {mode === "url" ? (
          <div className="flex flex-col gap-2 min-[700px]:flex-row min-[700px]:items-end">
            <FieldRow label="Domain or robots.txt URL" htmlFor="robots-url" className="min-w-0 flex-1" help="A bare domain is fetched at /robots.txt." error={blocked ? error : undefined}>
              <TextInput ref={urlRef} id="robots-url" value={url} autoFocus aria-invalid={blocked || undefined} onChange={(event) => setUrl(event.target.value)} />
            </FieldRow>
            <ActionButton type="button" className="btn btn-ink" aria-busy={busy} disabled={!url.trim() || busy} onClick={() => void run()}>Fetch</ActionButton>
          </div>
        ) : (
          <FieldRow label="robots.txt" htmlFor="robots-paste" help="Audited in the browser. Nothing is sent.">
            <TextArea id="robots-paste" value={pasted} onChange={(event) => setPasted(event.target.value)} className="min-h-40 font-mono text-xs" />
          </FieldRow>
        )}
      </div>
      <ToolPanes ratio="35/65">
        <Pane label="Summary">
          {active ? (
            <ScoreCard
              verdict={fails ? `${fails} ${fails === 1 ? "failure" : "failures"}` : "No failures"}
              caption={html ? "This response is HTML, not a robots.txt file." : "Allow, Disallow, and Sitemap lines."}
              stats={[
                { label: "Groups", value: String(active.document.groups.length) },
                { label: "Sitemaps", value: String(active.document.sitemaps.length) },
              ]}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{busy ? "Fetching robots.txt…" : "Nothing audited yet."}</p>
          )}
          {mode === "url" && result?.text ? <CodeOutput code={result.text} filename="robots.txt" label="Fetched file" /> : null}
          {active ? (
            <div className="flex flex-col text-[12.5px]">
              {active.document.groups.map((group) => (
                <section key={group.agents.join(",") || "group"} className="border-t border-border py-2">
                  <p className="truncate font-mono font-medium" title={`User-agent: ${group.agents.join(", ")}`}>User-agent: {group.agents.join(", ")}</p>
                  {group.crawlDelay ? <p className="mt-1 font-mono text-muted-foreground">Crawl-delay: {group.crawlDelay}</p> : null}
                  {group.allow.map((rule) => <p key={`a-${rule}`} className="mt-1 truncate font-mono text-status-ok" title={`Allow: ${rule || "—"}`}>Allow: {rule || "—"}</p>)}
                  {group.disallow.map((rule) => <p key={`d-${rule}`} className="mt-1 truncate font-mono text-status-bad" title={`Disallow: ${rule || "—"}`}>Disallow: {rule || "—"}</p>)}
                </section>
              ))}
              {active.document.sitemaps.map((sitemap) => (
                <p key={sitemap} className="truncate border-t border-border py-2 font-mono" title={`Sitemap: ${sitemap}`}>Sitemap: {sitemap}</p>
              ))}
            </div>
          ) : null}
        </Pane>
        <Pane label="Checks" padded={false} scroll={false} bodyClassName="flex min-h-[280px] flex-col">
          <div aria-live="polite" className="flex min-h-0 flex-1 flex-col">
            {busy ? <SkeletonRows /> : active ? (
              <>
                {html ? <Notice className="m-3" tone="bad" role="alert" title="This is not a robots.txt file." body="The URL returned a web page instead of a robots.txt file." /> : null}
                <ResultsTable rows={active.issues} empty="No issues in this file." />
              </>
            ) : (
              <EmptyState art={<Shield size={22} />} title={error || "Rules show up here"} hint="Allow and Disallow paths, sitemap links, and the mistakes that change what crawlers fetch." />
            )}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={status} tone={fails || error ? "warn" : active ? "pass" : "info"} trailing="⌘↵ fetch · ⌘⇧C copy report" />
    </ToolCard>
  );
}
