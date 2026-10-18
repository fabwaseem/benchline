"use client";

import { useState } from "react";
import { Copy, Globe } from "lucide-react";
import { toast } from "sonner";
import { TextInput } from "@/components/kit/controls";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { postTool } from "@/lib/post-tool";

type PageMarkdown = {
  url: string;
  title: string;
  markdown: string;
  excerpt: string;
  tokens: number;
  chars: number;
};

export default function HtmlToMarkdownTool() {
  const [url, setUrl] = useState("https://example.com");
  const [result, setResult] = useState<PageMarkdown | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function fetchPage() {
    setBusy(true);
    setError("");
    try {
      setResult(await postTool<PageMarkdown>("/api/tools/html-markdown", { url }));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Could not fetch that page.");
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    if (!result) return;
    void navigator.clipboard.writeText(result.markdown).then(() => toast.success("Markdown copied"));
  }

  useWorkbenchKeys({ onEnter: () => void fetchPage(), onCopy: copy });

  return (
    <ToolShell
      runsLocally={false}
      busy={busy}
      layout="split"
      tabs={<ToolTabs label="Source" value="url" onChange={() => undefined} options={[{ value: "url", label: "URL" }]} />}
      actions={<InkButton icon={<Globe size={15} />} disabled={busy || !url.trim()} onClick={() => void fetchPage()}>Fetch</InkButton>}
      status={
        <>
          <span className={error ? "dot dot-warn" : "dot"} />
          <span>{error || (busy ? "Fetching the public page" : "Private addresses are refused")}</span>
          <span className="ml-auto hidden min-[700px]:inline">⌘↵ fetch</span>
        </>
      }
      input={
        <Panel title="Page">
          <FieldRow label="Public URL" htmlFor="page-url" help="http or https. Local and private hosts are blocked.">
            <TextInput id="page-url" value={url} inputMode="url" onChange={(event) => setUrl(event.target.value)} />
          </FieldRow>
          <Notice tone="neutral" title="Article text." body="Navigation, ads, and scripts are stripped when the page has a readable article. The fetch stops at 800 KB." />
        </Panel>
      }
      output={
        <Panel title="Markdown">
          {error ? <Notice tone="bad" role="alert" title="Could not fetch the page" body={error} /> : null}
          {result ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <ResultStat label="Tokens" value={result.tokens.toLocaleString("en-US")} />
                <ResultStat label="Title" value={result.title || "Untitled"} />
              </div>
              <CodeOutput code={result.markdown} filename="page.md" label="Markdown" />
              <button type="button" className="btn btn-ghost h-9 self-start" onClick={copy}><Copy size={15} />Copy markdown</button>
            </div>
          ) : (
            <EmptyState art={<Globe size={22} />} title="No page yet" hint="Paste a public URL. The article comes back as Markdown." />
          )}
        </Panel>
      }
    />
  );
}
