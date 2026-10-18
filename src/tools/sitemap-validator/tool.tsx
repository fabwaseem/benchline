"use client";

import { useMemo, useRef, useState } from "react";
import { FileSearch } from "lucide-react";
import { ActionButton, TextArea, TextInput } from "@/components/kit/controls";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultTable } from "@/components/kit/result-table";
import { SkeletonRows } from "@/components/kit/skeleton-rows";
import { Pane, ResultsTable, ScoreCard, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { postTool } from "@/lib/post-tool";
import { analyzeSitemap, generateSitemap, type SitemapIssue, type SitemapUrl } from "@/tools/sitemap-validator/lib/sitemap";

type Report = {
  kind: string;
  urlCount: number;
  sitemapCount: number;
  urls: SitemapUrl[];
  sitemaps: string[];
  issues: SitemapIssue[];
  xml?: string;
  probes?: { url: string; status: number; error: string }[];
};

export default function SitemapTool() {
  const [tab, setTab] = useState<"url" | "xml" | "generate">("url");
  const [url, setUrl] = useState("");
  const [xml, setXml] = useState("");
  const [lines, setLines] = useState("https://example.com/\nhttps://example.com/docs");
  const [remote, setRemote] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const local = useMemo((): Report | { error: string } | null => {
    if (tab === "xml") return analyzeSitemap(xml);
    if (tab === "generate") {
      const generated = generateSitemap(lines.split(/\n/));
      if ("error" in generated) return generated;
      return { ...generated.report, xml: generated.xml };
    }
    return null;
  }, [lines, tab, xml]);

  const view: Report | { error: string } | null = tab === "url" ? remote : local;

  async function run() {
    if (!url.trim()) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError("");
    try {
      setRemote(await postTool<Report>("/api/tools/sitemap", { url, probe: true }, controller.signal));
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setRemote(null);
      setError(cause instanceof Error ? cause.message : "The check failed.");
    } finally {
      if (abortRef.current === controller) setBusy(false);
    }
  }

  useWorkbenchKeys({ onEnter: () => { if (tab === "url") void run(); }, onEscape: () => abortRef.current?.abort() });
  const shown = view && !("error" in view) ? view : null;
  const localError = view && "error" in view ? view.error : "";
  const fails = shown?.issues.filter((issue) => issue.level === "fail").length ?? 0;
  const note = busy ? "Fetching…" : error || localError || (shown ? `${shown.urlCount} URLs` : "Waiting");

  return (
    <ToolCard>
      <ToolToolbar
        label="Mode"
        options={[{ value: "url" as const, label: "URL" }, { value: "xml" as const, label: "XML" }, { value: "generate" as const, label: "Generate" }]}
        value={tab}
        onChange={setTab}
        actions={busy ? <ActionButton type="button" variant="outline" onClick={() => abortRef.current?.abort()}>Cancel</ActionButton> : null}
      />
      <ToolPanes ratio="40/60">
        <Pane label="Sitemap">
          {tab === "url" ? (
            <>
              <FieldRow label="Sitemap URL" htmlFor="sm-url" help="A bare domain loads /sitemap.xml only if you include that path." error={error || undefined}>
                <TextInput id="sm-url" value={url} className="font-mono" onChange={(event) => setUrl(event.target.value)} />
              </FieldRow>
              <ActionButton type="button" className="btn btn-ink" disabled={!url.trim() || busy} onClick={() => void run()}>Check</ActionButton>
            </>
          ) : null}
          {tab === "xml" ? (
            <FieldRow label="XML" htmlFor="sm-xml" error={localError || undefined}>
              <TextArea id="sm-xml" value={xml} className="min-h-64 font-mono" onChange={(event) => setXml(event.target.value)} />
            </FieldRow>
          ) : null}
          {tab === "generate" ? (
            <FieldRow label="URLs" htmlFor="sm-lines" help="One absolute URL per line. Checked in the browser." error={localError || undefined}>
              <TextArea id="sm-lines" value={lines} className="min-h-64 font-mono" onChange={(event) => setLines(event.target.value)} />
            </FieldRow>
          ) : null}
        </Pane>
        <Pane label="Report" padded={false} scroll={false} bodyClassName="flex min-h-[280px] flex-col">
          <div aria-live="polite" className="flex min-h-0 flex-1 flex-col overflow-auto">
            {busy ? <SkeletonRows /> : shown ? (
              <>
                <div className="flex flex-col gap-3 border-b border-border p-3">
                  <ScoreCard
                    verdict={fails ? `${fails} ${fails === 1 ? "failure" : "failures"}` : `${shown.urlCount} URLs`}
                    caption={shown.kind === "index" ? "Sitemap index." : "URL set."}
                    stats={[
                      { label: "Kind", value: shown.kind },
                      { label: "Sitemaps", value: String(shown.sitemapCount) },
                    ]}
                  />
                  {shown.urls.length > 0 ? (
                    <ResultTable
                      caption="URLs"
                      columns={[{ key: "loc", label: "loc" }, { key: "lastmod", label: "lastmod" }]}
                      rows={shown.urls.map((item) => ({
                        key: item.loc + item.lastmod,
                        cells: [
                          <span key="loc" className="block max-w-[18rem] truncate" title={item.loc}>{item.loc}</span>,
                          item.lastmod || "—",
                        ],
                      }))}
                    />
                  ) : null}
                  {shown.probes && shown.probes.length > 0 ? (
                    <ResultTable
                      caption="Status sample"
                      columns={[{ key: "url", label: "URL" }, { key: "status", label: "Status" }]}
                      rows={shown.probes.map((probe) => ({
                        key: probe.url,
                        cells: [
                          <span key="url" className="block max-w-[18rem] truncate" title={probe.url}>{probe.url}</span>,
                          probe.error || String(probe.status),
                        ],
                      }))}
                    />
                  ) : null}
                  {shown.xml ? <CodeOutput code={shown.xml} filename="sitemap.xml" label="sitemap.xml" /> : null}
                </div>
                <ResultsTable rows={shown.issues.slice(0, 40)} empty="No issues in this sitemap." />
              </>
            ) : (
              <EmptyState art={<FileSearch size={22} />} title={error || localError || "The report shows up here"} hint="Counts, lastmod, and a sample of HTTP statuses for a public sitemap." />
            )}
            {error ? <Notice className="m-3" tone="bad" role="alert" title="The check failed." body={error} /> : null}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={note} tone={error || localError || fails ? "warn" : shown ? "pass" : "info"} trailing="⌘↵ check · esc cancel" />
    </ToolCard>
  );
}
