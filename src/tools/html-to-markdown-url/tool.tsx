"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { toast } from "sonner";
import { ActionButton, TextInput } from "@/components/kit/controls";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
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
    <ToolCard>
      <ToolToolbar
        actions={
          <>
            <ActionButton className="btn btn-ink" disabled={busy || !url.trim()} onClick={() => void fetchPage()}>{busy ? "Fetching" : "Fetch"}</ActionButton>
            <ActionButton variant="outline" disabled={!result} onClick={copy}>Copy</ActionButton>
          </>
        }
      />
      <ToolPanes ratio="40/60">
        <Pane label="Page">
          <FieldRow label="Public URL" htmlFor="page-url" help="http or https. Local and private hosts are blocked.">
            <TextInput id="page-url" value={url} inputMode="url" onChange={(event) => setUrl(event.target.value)} />
          </FieldRow>
          <Notice tone="neutral" title="Article text." body="Navigation, ads, and scripts are stripped when the page has a readable article. The fetch stops at 800 KB." />
          {error ? <Notice tone="bad" role="alert" title="Could not fetch the page" body={error} /> : null}
        </Pane>
        <Pane label="Markdown" padded={result ? false : true} scroll={result ? false : true}>
          {result ? (
            <CodeOutput code={result.markdown} filename="page.md" label="Markdown" fill chrome={false} />
          ) : (
            <EmptyState art={<Globe size={22} />} title="No page yet" hint="Paste a public URL. The article comes back as Markdown." />
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={error || (busy ? "Fetching the public page" : "Private addresses are refused")}
        tone={error ? "fail" : "pass"}
        trailing="⌘↵ fetch"
        items={[
          { level: result ? "pass" : "info", label: "Title", detail: result?.title || "—" },
          { level: "info", label: "Tokens", detail: result ? result.tokens.toLocaleString("en-US") : "—" },
        ]}
      />
    </ToolCard>
  );
}
