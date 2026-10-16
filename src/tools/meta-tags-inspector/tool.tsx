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
import { postTool } from "@/lib/post-tool";
import { tagsFromDraft, type Inspection, type TagDraft } from "@/tools/meta-tags-inspector/lib/meta";

const draftStart: TagDraft = {
  title: "A title that still fits the snippet",
  description: "A description long enough to explain the page and short enough to survive the preview.",
  url: "https://example.com/post",
  image: "https://example.com/card.png",
  siteName: "Example",
  card: "summary_large_image",
};

export default function MetaTool() {
  const [mode, setMode] = useState<"url" | "write">("url");
  const [url, setUrl] = useState("https://example.com");
  const [result, setResult] = useState<Inspection | null>(null);
  const [draft, setDraft] = useState<TagDraft>(draftStart);
  const [imageSize, setImageSize] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const written = useMemo(() => tagsFromDraft(draft), [draft]);

  async function run() {
    setBusy(true);
    setError("");
    try {
      const next = await postTool<Inspection>("/api/tools/meta-tags", { url });
      setResult(next);
      setDraft({
        title: next.title || draft.title,
        description: next.description || draft.description,
        url: next.canonical || next.finalUrl,
        image: next.og["og:image"] || "",
        siteName: next.og["og:site_name"] || "",
        card: next.twitter["twitter:card"] === "summary" ? "summary" : "summary_large_image",
      });
    } catch (cause) {
      setResult(null);
      setError(cause instanceof Error ? cause.message : "The inspection failed.");
    } finally {
      setBusy(false);
    }
  }

  const view = mode === "write"
    ? { title: draft.title, description: draft.description, image: draft.image, url: draft.url, siteName: draft.siteName }
    : result
      ? { title: result.og["og:title"] || result.title, description: result.og["og:description"] || result.description, image: result.og["og:image"] || "", url: result.finalUrl, siteName: result.og["og:site_name"] || "" }
      : null;

  return (
    <ToolShell
      runsLocally={mode === "write"}
      actions={mode === "url" ? <Button type="button" onClick={() => void run()} disabled={busy}>{busy ? "Reading" : "Inspect"}</Button> : null}
      input={
        <>
          <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: "url", label: "Check a URL" }, { value: "write", label: "Write tags" }]} />
          {mode === "url" ? (
            <FieldRow label="Page URL" htmlFor="meta-url" help="A bare domain is fine. The image itself is loaded in your browser.">
              <Input id="meta-url" value={url} onChange={(event) => setUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void run(); }} />
            </FieldRow>
          ) : (
            <div className="grid gap-3">
              <FieldRow label="Title" htmlFor="meta-title"><Input id="meta-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></FieldRow>
              <FieldRow label="Description" htmlFor="meta-desc"><Input id="meta-desc" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></FieldRow>
              <FieldRow label="URL" htmlFor="meta-canonical"><Input id="meta-canonical" value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} /></FieldRow>
              <FieldRow label="Image URL" htmlFor="meta-image"><Input id="meta-image" value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} /></FieldRow>
              <FieldRow label="Site name" htmlFor="meta-site"><Input id="meta-site" value={draft.siteName} onChange={(event) => setDraft({ ...draft, siteName: event.target.value })} /></FieldRow>
              <Segmented label="Twitter card" value={draft.card} onChange={(card) => setDraft({ ...draft, card })} options={[{ value: "summary_large_image", label: "Large image" }, { value: "summary", label: "Summary" }]} />
            </div>
          )}
        </>
      }
      output={
        view ? (
          <div className="flex flex-col gap-3" aria-live="polite">
            <Preview title={view.title} description={view.description} image={view.image} url={view.url} siteName={view.siteName} onSize={setImageSize} />
            {imageSize ? <p className="text-xs text-muted-foreground">{imageSize}</p> : null}
            {mode === "url" && result ? <CheckList rows={result.checks} /> : null}
            {mode === "url" && result ? <p className="text-xs text-muted-foreground">JSON-LD: {result.jsonLdTypes.join(", ") || "none"}</p> : null}
            <CodeOutput code={mode === "write" ? written.meta : tagsFromDraft(draft).meta} filename="meta.html" label="meta tags" />
            <CodeOutput code={written.next} filename="metadata.ts" label="Next.js metadata" />
          </div>
        ) : (
          <EmptyState title={error || "Previews show up here"} hint="Title, description, canonical, robots, Open Graph, Twitter, and JSON-LD types." />
        )
      }
    />
  );
}

function Preview({ title, description, image, url, siteName, onSize }: { title: string; description: string; image: string; url: string; siteName: string; onSize: (value: string) => void }) {
  let host = url;
  try { host = new URL(url).hostname; } catch { host = siteName || url; }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <article className="rounded-lg border border-border bg-background p-3">
        <p className="text-[11px] text-muted-foreground">Google</p>
        <p className="mt-1 truncate text-xs text-cat-seo">{host}</p>
        <p className="truncate text-sm text-primary">{title}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
      </article>
      <article className="overflow-hidden rounded-lg border border-border bg-background">
        <p className="px-3 pt-2 text-[11px] text-muted-foreground">X · LinkedIn · Slack</p>
        {image ? (
          // The preview image is the page's own og:image. It is not optimized by us.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            referrerPolicy="no-referrer"
            className="mt-2 aspect-[1.91/1] w-full object-cover"
            onLoad={(event) => {
              const img = event.currentTarget;
              const ratio = img.naturalWidth / img.naturalHeight;
              const warn = img.naturalWidth < 600 || Math.abs(ratio - 1.91) > 0.15 ? " · not 1200×630" : "";
              onSize(`${img.naturalWidth}×${img.naturalHeight}${warn}`);
            }}
            onError={() => onSize("Image failed to load")}
          />
        ) : <div className="mt-2 aspect-[1.91/1] bg-muted" />}
        <div className="p-3">
          <p className="text-xs text-muted-foreground">{host}</p>
          <p className="text-sm font-medium">{title}</p>
          <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
        </div>
      </article>
    </div>
  );
}
