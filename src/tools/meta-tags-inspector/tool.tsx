"use client";

import { useMemo, useRef, useState } from "react";
import { ActionButton, TextInput } from "@/components/kit/controls";
import { Copy, Tags } from "lucide-react";
import { toast } from "sonner";
import { CheckRows } from "@/components/kit/check-row";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { SkeletonRows } from "@/components/kit/skeleton-rows";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { postTool } from "@/lib/post-tool";
import { characterBudget, tagsFromDraft, type Inspection, type TagDraft } from "@/tools/meta-tags-inspector/lib/meta";

const draftStart: TagDraft = {
  title: "A title that still fits the snippet",
  description: "A description long enough to explain the page and short enough to survive the preview.",
  url: "https://example.com/post",
  image: "https://example.com/card.png",
  siteName: "Example",
  card: "summary_large_image",
};

type PreviewName = "google" | "x" | "linkedin" | "slack";

export default function MetaTool() {
  const [mode, setMode] = useState<"url" | "write">("url");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Inspection | null>(null);
  const [draft, setDraft] = useState<TagDraft>(draftStart);
  const [imageSize, setImageSize] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [preview, setPreview] = useState<PreviewName>("google");
  const abortRef = useRef<AbortController | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const written = useMemo(() => tagsFromDraft(draft), [draft]);
  const titleBudget = characterBudget(draft.title, 15, 60);
  const descriptionBudget = characterBudget(draft.description, 50, 160);
  const blocked = /private|loopback/i.test(error);

  async function run() {
    if (!url.trim()) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError("");
    const started = performance.now();
    try {
      const next = await postTool<Inspection>("/api/tools/meta-tags", { url }, controller.signal);
      setResult(next);
      setElapsed(performance.now() - started);
      setDraft({
        title: next.title || draft.title,
        description: next.description || draft.description,
        url: next.canonical || next.finalUrl,
        image: next.og["og:image"] || "",
        siteName: next.og["og:site_name"] || "",
        card: next.twitter["twitter:card"] === "summary" ? "summary" : "summary_large_image",
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setResult(null);
      const message = cause instanceof Error ? cause.message : "The inspection failed.";
      setError(/private address/i.test(message) ? "Private addresses are refused." : message === "The check failed." ? "The inspection failed." : message);
    } finally {
      if (abortRef.current === controller) setBusy(false);
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setBusy(false);
    urlRef.current?.focus();
  }

  const view = mode === "write"
    ? { title: draft.title, description: draft.description, image: draft.image, url: draft.url, siteName: draft.siteName }
    : result
      ? { title: result.og["og:title"] || result.title, description: result.og["og:description"] || result.description, image: result.og["og:image"] || "", url: result.finalUrl, siteName: result.og["og:site_name"] || "" }
      : null;
  const metaText = mode === "write" || result ? written.meta : "";

  useWorkbenchKeys({
    onEnter: () => {
      if (mode === "url") void run();
    },
    onCopy: () => {
      if (!metaText) return;
      void navigator.clipboard.writeText(metaText).then(() => toast.success("Meta tags copied"));
    },
    onEscape: cancel,
  });

  const status = mode === "write"
    ? "Write mode · nothing fetched"
    : busy
      ? `GET ${url}…`
      : result
        ? `GET ${result.finalUrl} · ${result.checks.length} tags · ${(elapsed / 1000).toFixed(1)} s`
        : error
          ? "Failed"
          : "Waiting for a URL";

  return (
    <ToolShell
      runsLocally={mode === "write"}
      busy={busy}
      layout="split+inspector"
      flow="band"
      columns="min-[1280px]:grid-cols-[340px_minmax(0,1fr)_340px]"
      tabs={<ToolTabs label="Mode" value="inspect" onChange={() => {}} options={[{ value: "inspect", label: "Inspect" }]} />}
      actions={busy ? <ActionButton type="button" variant="outline" className="h-[30px]" onClick={cancel}>Cancel</ActionButton> : <InkButton disabled={!metaText} icon={<Copy size={15} />} onClick={() => void navigator.clipboard.writeText(metaText).then(() => toast.success("Meta tags copied"))}>Copy meta tags</InkButton>}
      status={
        <>
          <span className={error ? "dot dot-warn" : "dot"} />
          <span>{status}</span>
          <span className="ml-auto hidden min-[700px]:inline">⌘↵ inspect · ⌘⇧C copy meta tags</span>
        </>
      }
      input={
        <Panel title="Source">
          <p className="text-[12.5px] text-muted-foreground">Title, description, canonical, robots, Open Graph, Twitter, and JSON-LD types.</p>
          <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: "url", label: "Check a URL" }, { value: "write", label: "Write tags" }]} />
          {mode === "url" ? (
            <>
              <FieldRow label="Page URL" htmlFor="meta-url" help="A bare domain is fine. The image itself is loaded in your browser." error={blocked ? error : undefined}>
                <TextInput ref={urlRef} id="meta-url" value={url} autoFocus aria-invalid={blocked || undefined} onChange={(event) => setUrl(event.target.value)} className="max-[699px]:h-11" />
              </FieldRow>
              <ActionButton type="button" className="btn btn-ink h-11" aria-busy={busy} disabled={!url.trim() || busy} onClick={() => void run()}>Inspect</ActionButton>
            </>
          ) : (
            <div className="grid gap-3">
              <FieldRow
                label="Title"
                htmlFor="meta-title"
                help={titleBudget.state === "warn" ? `${titleBudget.length} characters. Usual range is 15–60.` : undefined}
                actions={<span className={titleBudget.state === "ok" ? "font-mono text-[12px] text-faint" : "font-mono text-[12px] text-status-warn"}>{titleBudget.label}</span>}
              >
                <TextInput id="meta-title" value={draft.title} aria-invalid={titleBudget.state === "warn" || undefined} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="max-[699px]:h-11" />
              </FieldRow>
              <FieldRow
                label="Description"
                htmlFor="meta-desc"
                help={descriptionBudget.state === "warn" ? `${descriptionBudget.length} characters. Usual range is 50–160.` : undefined}
                actions={<span className={descriptionBudget.state === "ok" ? "font-mono text-[12px] text-faint" : "font-mono text-[12px] text-status-warn"}>{descriptionBudget.label}</span>}
              >
                <TextInput id="meta-desc" value={draft.description} aria-invalid={descriptionBudget.state === "warn" || undefined} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="max-[699px]:h-11" />
              </FieldRow>
              <FieldRow label="URL" htmlFor="meta-canonical"><TextInput id="meta-canonical" value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} className="max-[699px]:h-11" /></FieldRow>
              <FieldRow label="Image URL" htmlFor="meta-image"><TextInput id="meta-image" value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} className="max-[699px]:h-11" /></FieldRow>
              <FieldRow label="Site name" htmlFor="meta-site"><TextInput id="meta-site" value={draft.siteName} onChange={(event) => setDraft({ ...draft, siteName: event.target.value })} className="max-[699px]:h-11" /></FieldRow>
              <Segmented label="Twitter card" value={draft.card} onChange={(card) => setDraft({ ...draft, card })} options={[{ value: "summary_large_image", label: "Large image" }, { value: "summary", label: "Summary" }]} />
            </div>
          )}
        </Panel>
      }
      output={
        <div aria-live="polite" className="min-h-[240px]">
          {busy ? <SkeletonRows /> : view ? (
            <Panel title="Previews">
              <Segmented label="Preview" value={preview} onChange={setPreview} options={[{ value: "google", label: "Google" }, { value: "x", label: "X" }, { value: "linkedin", label: "LinkedIn" }, { value: "slack", label: "Slack" }]} />
              <Preview kind={preview} title={view.title} description={view.description} image={view.image} url={view.url} siteName={view.siteName} onSize={setImageSize} />
              {imageSize ? <p className="font-mono text-[12px] text-muted-foreground">{imageSize}</p> : null}
              <CodeOutput code={written.next} filename="metadata.ts" label="Next.js metadata" />
            </Panel>
          ) : (
            <EmptyState art={<Tags size={22} />} title={error || "Previews show up here"} hint="Title, description, canonical, robots, Open Graph, Twitter, and JSON-LD types." />
          )}
        </div>
      }
      inspector={
        <Panel title="Checklist">
          {mode === "url" && result ? <CheckRows rows={result.checks} /> : mode === "write" ? (
            <CheckRows
              rows={[
                { level: titleBudget.state === "ok" ? "pass" : "warn", label: "Title", detail: `${titleBudget.length} characters. Usual range is 15–60.` },
                { level: descriptionBudget.state === "ok" ? "pass" : "warn", label: "Description", detail: `${descriptionBudget.length} characters. Usual range is 50–160.` },
                { level: draft.image ? "pass" : "fail", label: "og:image", detail: draft.image || "Missing. Previews will have no image." },
                { level: draft.card ? "pass" : "warn", label: "twitter:card", detail: draft.card || "X will fall back to Open Graph." },
              ]}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{busy ? "Fetching the page…" : "Nothing inspected yet."}</p>
          )}
          {mode === "url" && result ? <p className="text-[12.5px] text-muted-foreground">JSON-LD: {result.jsonLdTypes.join(", ") || "none"}</p> : null}
          {error && !blocked ? <Notice tone="bad" role="alert" title="The inspection failed." body={error} /> : null}
          {metaText ? <CodeOutput code={metaText} filename="meta.html" label="meta tags" /> : null}
        </Panel>
      }
    />
  );
}

function Preview({ kind, title, description, image, url, siteName, onSize }: { kind: PreviewName; title: string; description: string; image: string; url: string; siteName: string; onSize: (value: string) => void }) {
  let host = url;
  try { host = new URL(url).hostname; } catch { host = siteName || url; }
  if (kind === "google") {
    return (
      <article className="rounded-lg border border-border bg-background p-3">
        <p className="truncate text-xs text-status-ok">{host}</p>
        <p className="truncate text-sm text-foreground">{title}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
      </article>
    );
  }
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-background">
      <p className="px-3 pt-2 text-[11px] text-muted-foreground">{kind === "x" ? "X" : kind === "linkedin" ? "LinkedIn" : "Slack"}</p>
      {image && kind !== "slack" ? (
        // The preview image is the page's own og:image.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" referrerPolicy="no-referrer" className="mt-2 aspect-[1.91/1] w-full object-cover" onLoad={(event) => onSize(`${event.currentTarget.naturalWidth}×${event.currentTarget.naturalHeight}`)} onError={() => onSize("Image failed to load")} />
      ) : <div className="mt-2 aspect-[1.91/1] bg-muted" />}
      <div className="p-3">
        <p className="text-xs text-muted-foreground">{host}</p>
        <p className="text-sm font-medium">{title}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
      </div>
    </article>
  );
}
