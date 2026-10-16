"use client";

import { useMemo, useState } from "react";
import { CheckList } from "@/components/kit/check-list";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Segmented } from "@/components/kit/segmented";
import { ToolShell } from "@/components/kit/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { postTool } from "@/lib/post-tool";
import { parseRobots, robotsIssues, type RobotsDocument } from "@/lib/robots";

type Result = { finalUrl: string; status: number; text: string; document: RobotsDocument; issues: { level: "pass" | "warn" | "fail" | "info"; label: string; detail: string }[] };

export default function RobotsTool() {
  const [mode, setMode] = useState<"url" | "paste">("url");
  const [url, setUrl] = useState("https://example.com");
  const [pasted, setPasted] = useState("User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml\n");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const local = useMemo(() => {
    const document = parseRobots(pasted);
    return { document, issues: robotsIssues(document) };
  }, [pasted]);

  async function run() {
    setBusy(true);
    setError("");
    try {
      setResult(await postTool<Result>("/api/tools/robots-txt", { url }));
    } catch (cause) {
      setResult(null);
      setError(cause instanceof Error ? cause.message : "The check failed.");
    } finally {
      setBusy(false);
    }
  }

  const active = mode === "paste" ? { text: pasted, ...local, finalUrl: "Pasted file", status: 0 } : result;

  return (
    <ToolShell
      runsLocally={mode === "paste"}
      actions={mode === "url" ? <Button type="button" onClick={() => void run()} disabled={busy}>{busy ? "Reading" : "Check robots.txt"}</Button> : null}
      input={
        <>
          <Segmented label="Source" value={mode} onChange={setMode} options={[{ value: "url", label: "Fetch URL" }, { value: "paste", label: "Paste file" }]} />
          {mode === "url" ? (
            <FieldRow label="Domain or robots.txt URL" htmlFor="robots-url" help="A bare domain is fetched at /robots.txt.">
              <Input id="robots-url" value={url} onChange={(event) => setUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void run(); }} />
            </FieldRow>
          ) : (
            <FieldRow label="robots.txt" htmlFor="robots-paste" help="Audited in the browser. Nothing is sent.">
              <Textarea id="robots-paste" value={pasted} onChange={(event) => setPasted(event.target.value)} className="min-h-48 font-mono text-xs" />
            </FieldRow>
          )}
        </>
      }
      output={
        active ? (
          <div className="flex flex-col gap-3" aria-live="polite">
            <p className="text-xs text-muted-foreground">{active.finalUrl}{active.status ? ` · ${active.status}` : ""}</p>
            <CheckList rows={active.issues} />
            <ul className="flex flex-col gap-2 text-sm">
              {active.document.groups.map((group) => (
                <li key={group.agents.join(",")} className="rounded-lg border border-border px-3 py-2">
                  <p className="font-medium">{group.agents.join(", ")}</p>
                  <p className="text-xs text-muted-foreground">Allow: {group.allow.join(", ") || "—"}</p>
                  <p className="text-xs text-muted-foreground">Disallow: {group.disallow.join(", ") || "—"}</p>
                </li>
              ))}
            </ul>
            {active.document.sitemaps.length > 0 ? <p className="text-xs">Sitemaps: {active.document.sitemaps.join(", ")}</p> : null}
            {mode === "url" && result?.text ? <CodeOutput code={result.text} filename="robots.txt" label="robots.txt" /> : null}
          </div>
        ) : (
          <EmptyState title={error || "Rules show up here"} hint="Allow and Disallow paths, sitemap links, and the mistakes that change what crawlers fetch." />
        )
      }
    />
  );
}
