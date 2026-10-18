"use client";

import { useMemo, useRef, useState } from "react";
import { ActionButton, TextInput } from "@/components/kit/controls";
import { Tags } from "lucide-react";
import { toast } from "sonner";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { SkeletonRows } from "@/components/kit/skeleton-rows";
import { Pane, ResultsTable, ScoreCard, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
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

  const writeRows = [
    { level: titleBudget.state === "ok" ? "pass" as const : "warn" as const, label: "Title", detail: `${titleBudget.length} characters. Usual range is 15–60.` },
    { level: descriptionBudget.state === "ok" ? "pass" as const : "warn" as const, label: "Description", detail: `${descriptionBudget.length} characters. Usual range is 50–160.` },
    { level: draft.image ? "pass" as const : "fail" as const, label: "og:image", detail: draft.image || "Missing. Previews will have no image." },
    { level: draft.card ? "pass" as const : "warn" as const, label: "twitter:card", detail: draft.card || "X will fall back to Open Graph." },
  ];
  const rows = mode === "url" && result ? result.checks : mode === "write" ? writeRows : [];
  const fails = rows.filter((row) => row.level === "fail").length;

  return (
    <ToolCard>
      <ToolToolbar
        label="Mode"
        options={[{ value: "url" as const, label: "Check a URL" }, { value: "write" as const, label: "Write tags" }]}
        value={mode}
        onChange={setMode}
        actions={
          busy ? (
            <ActionButton type="button" variant="outline" onClick={cancel}>Cancel</ActionButton>
          ) : (
            <ActionButton type="button" className="btn btn-ink" disabled={!metaText} onClick={() => void navigator.clipboard.writeText(metaText).then(() => toast.success("Meta tags copied"))}>Copy meta tags</ActionButton>
          )
        }
      />
      {mode === "url" ? (
        <div className="flex flex-col gap-3 border-b border-border p-3 min-[700px]:flex-row min-[700px]:items-end">
          <FieldRow label="Page URL" htmlFor="meta-url" className="min-w-0 flex-1" help="A bare domain is fine. The image itself is loaded in your browser." error={blocked ? error : undefined}>
            <TextInput ref={urlRef} id="meta-url" value={url} autoFocus aria-invalid={blocked || undefined} onChange={(event) => setUrl(event.target.value)} />
          </FieldRow>
          <ActionButton type="button" className="btn btn-ink" aria-busy={busy} disabled={!url.trim() || busy} onClick={() => void run()}>Inspect</ActionButton>
        </div>
      ) : null}
      <ToolPanes ratio={mode === "write" ? "50/50" : "40/60"}>
        <Pane label={mode === "write" ? "Fields" : "Preview"}>
          {mode === "write" ? (
            <div className="grid gap-3">
              <FieldRow
                label="Title"
                htmlFor="meta-title"
                help={titleBudget.state === "warn" ? `${titleBudget.length} characters. Usual range is 15–60.` : undefined}
                actions={<span className="font-mono text-[12px] whitespace-nowrap text-faint">{titleBudget.label}</span>}
              >
                <TextInput id="meta-title" value={draft.title} aria-invalid={titleBudget.state === "warn" || undefined} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
              </FieldRow>
              <FieldRow
                label="Description"
                htmlFor="meta-desc"
                help={descriptionBudget.state === "warn" ? `${descriptionBudget.length} characters. Usual range is 50–160.` : undefined}
                actions={<span className="font-mono text-[12px] whitespace-nowrap text-faint">{descriptionBudget.label}</span>}
              >
                <TextInput id="meta-desc" value={draft.description} aria-invalid={descriptionBudget.state === "warn" || undefined} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
              </FieldRow>
              <FieldRow label="URL" htmlFor="meta-canonical"><TextInput id="meta-canonical" value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} /></FieldRow>
              <FieldRow label="Image URL" htmlFor="meta-image"><TextInput id="meta-image" value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} /></FieldRow>
              <FieldRow label="Site name" htmlFor="meta-site"><TextInput id="meta-site" value={draft.siteName} onChange={(event) => setDraft({ ...draft, siteName: event.target.value })} /></FieldRow>
              <Segmented label="Twitter card" value={draft.card} onChange={(card) => setDraft({ ...draft, card })} options={[{ value: "summary_large_image", label: "Large image" }, { value: "summary", label: "Summary" }]} />
            </div>
          ) : busy ? <SkeletonRows /> : view ? (
            <>
              <ScoreCard
                verdict={view.title || "No title"}
                caption={view.description || "No description."}
                stats={[
                  { label: "Host", value: hostOf(view.url) || view.siteName || "—" },
                  { label: "JSON-LD", value: result?.jsonLdTypes.join(", ") || "none" },
                ]}
              />
              <Segmented label="Preview" value={preview} onChange={setPreview} options={[{ value: "google", label: "Google" }, { value: "x", label: "X" }, { value: "linkedin", label: "LinkedIn" }, { value: "slack", label: "Slack" }]} />
              <Preview kind={preview} title={view.title} description={view.description} image={view.image} url={view.url} siteName={view.siteName} onSize={setImageSize} />
              {imageSize ? <p className="truncate font-mono text-[12px] text-muted-foreground" title={imageSize}>{imageSize}</p> : null}
            </>
          ) : (
            <EmptyState art={<Tags size={22} />} title={error || "Previews show up here"} hint="Title, description, canonical, robots, Open Graph, Twitter, and JSON-LD types." />
          )}
        </Pane>
        <Pane label="Checks" padded={false} scroll={false} bodyClassName="flex min-h-[280px] flex-col">
          <div aria-live="polite" className="flex min-h-0 flex-1 flex-col">
            {rows.length > 0 ? <ResultsTable rows={rows} /> : <p className="px-3 py-6 text-sm text-muted-foreground">{busy ? "Fetching the page…" : "Nothing inspected yet."}</p>}
            {error && !blocked ? <Notice className="m-3" tone="bad" role="alert" title="The inspection failed." body={error} /> : null}
            {metaText ? <div className="border-t border-border p-3"><CodeOutput code={metaText} filename="meta.html" label="meta tags" /></div> : null}
            {mode === "write" && written.next ? <div className="border-t border-border p-3"><CodeOutput code={written.next} filename="metadata.ts" label="Next.js metadata" /></div> : null}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={status} tone={error || fails ? "warn" : rows.length ? "pass" : "info"} trailing="⌘↵ inspect · ⌘⇧C copy meta tags" />
    </ToolCard>
  );
}

function hostOf(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
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
