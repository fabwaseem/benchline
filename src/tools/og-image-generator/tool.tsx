"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { converter, formatHex, parse } from "culori";
import { Copy, Dices, Download, ImageIcon, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { CodeViewer } from "@/components/kit/code-viewer";
import { ChipButton, ColorInput, TextArea, TextInput } from "@/components/kit/controls";
import { Dropzone } from "@/components/kit/dropzone";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { metaTagsFor, OG_SIZES, ogTemplates, openGraphSource, renderOg, resolveState, templateById, titleFit, type OgState } from "@/tools/og-image-generator/lib/og";
import { IMAGE_LABELS, fieldMeta } from "@/tools/og-image-generator/lib/templates";
import { blankImages, type FieldKey, type ImageKey, type OgColors, type OgFields, type OgImages, type OgSizeId } from "@/tools/og-image-generator/lib/types";
import "./fonts.css";

const LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const CATEGORIES = ["All", "Blog", "Product", "Dev", "Social", "Event"] as const;
const COLOR_KEYS = [
  { key: "background", label: "Background" },
  { key: "foreground", label: "Text" },
  { key: "accent", label: "Accent" },
  { key: "muted", label: "Muted" },
] as const;
const toOklch = converter("oklch");

export default function OgTool() {
  const first = ogTemplates[0];
  const [templateId, setTemplateId] = useState(first?.id ?? "editorial");
  const [fields, setFields] = useState<OgFields>(first?.defaults ?? resolveState().fields);
  const [colors, setColors] = useState<OgColors>(first?.colors ?? resolveState().colors);
  const [images, setImages] = useState<OgImages>(blankImages);
  const [size, setSize] = useState<OgSizeId>("1200x630");
  const [tab, setTab] = useState<"preview" | "code" | "meta">("preview");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [imageError, setImageError] = useState("");
  const [busy, setBusy] = useState(false);
  const template = templateById(templateId);
  const state = useMemo<OgState>(() => resolveState({
    template: template.id,
    size,
    ...fields,
    colors,
    images,
  }), [colors, fields, images, size, template.id]);
  const fit = titleFit(state);
  const source = openGraphSource(state);
  const meta = metaTagsFor(state);
  const visible = ogTemplates.filter((item) => {
    const haystack = `${item.name} ${item.category}`.toLowerCase();
    const matchesQuery = haystack.includes(query.trim().toLowerCase());
    const matchesCategory = category === "All" || item.category === category;
    return matchesQuery && matchesCategory;
  });

  function choose(id: string) {
    const next = templateById(id);
    setTemplateId(next.id);
    setFields(next.defaults);
    setColors(next.colors);
    setImages(blankImages);
    setImageError("");
  }

  function reset() {
    choose(ogTemplates[0]?.id ?? "editorial");
    setSize("1200x630");
    setQuery("");
    setCategory("All");
    setTab("preview");
  }

  function randomize() {
    const presets = template.presets;
    if (presets.length === 0) return;
    const next = presets[Math.floor(Math.random() * presets.length)];
    if (next) setColors(next.colors);
  }

  async function download() {
    setBusy(true);
    try {
      const { rasterizeCard } = await import("@/tools/og-image-generator/lib/png-browser");
      const href = await rasterizeCard(renderOg(state), state.width, state.height);
      const link = document.createElement("a");
      link.href = href;
      link.download = `${template.id}.png`;
      link.click();
      toast.success("Downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not draw the PNG.");
    } finally {
      setBusy(false);
    }
  }

  function copyCode() {
    void navigator.clipboard.writeText(tab === "meta" ? meta : source).then(() => toast.success(tab === "meta" ? "Meta tags copied" : "Code copied"));
  }

  function takeImage(key: ImageKey, file: File) {
    const named = LOGO_TYPES.has(file.type) || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
    if (!named) {
      setImages({ ...images, [key]: "" });
      setImageError(`${file.name} is not a PNG, JPEG, WebP, or GIF. Pick one of those.`);
      return;
    }
    setImageError("");
    const reader = new FileReader();
    reader.onload = () => setImages((current) => ({ ...current, [key]: String(reader.result ?? "") }));
    reader.readAsDataURL(file);
  }

  useWorkbenchKeys({
    onEnter: () => void download(),
    onCopy: copyCode,
    onEscape: reset,
  });

  return (
    <ToolShell
      runsLocally
      layout="split"
      actions={
        <>
          <ChipButton className="h-8 max-[699px]:h-11" onClick={reset}><RotateCcw size={14} /> Reset</ChipButton>
          <ChipButton className="h-8 max-[699px]:h-11" onClick={randomize}><Dices size={14} /> Randomize</ChipButton>
          <ChipButton className="h-8 max-[699px]:h-11" onClick={copyCode}><Copy size={14} /> Copy code</ChipButton>
          <InkButton onClick={() => void download()} disabled={busy} icon={<Download size={15} />}>{busy ? "Drawing…" : "Download PNG"}</InkButton>
        </>
      }
      status={
        <>
          <span className={imageError || fit.clipped ? "dot dot-warn" : "dot"} />
          <span>{imageError || `${template.name} · ${OG_SIZES[size].width}×${OG_SIZES[size].height} · ${fit.notice.replace(/\.$/, "")}`}</span>
          <span className="ml-auto hidden min-[700px]:inline">⌘↵ download PNG · ⌘⇧C copy code · esc reset</span>
        </>
      }
      input={
        <div className="flex max-h-[calc(100vh-8rem)] min-w-0 flex-col overflow-auto">
          <Panel title="Templates">
            <TextInput aria-label="Search templates" placeholder="Search templates" value={query} onChange={(event) => setQuery(event.target.value)} />
            <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label="Template categories">
              {CATEGORIES.map((item) => (
                <ChipButton key={item} pressed={category === item} onClick={() => setCategory(item)}>{item}</ChipButton>
              ))}
            </div>
            <div role="radiogroup" aria-label="Template" className="grid grid-cols-3 gap-2">
              {visible.map((item) => {
                const selected = item.id === template.id;
                const thumb = resolveState({ template: item.id });
                return (
                  <div
                    key={item.id}
                    role="radio"
                    aria-checked={selected}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => choose(item.id)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      choose(item.id);
                    }}
                    className={selected ? "cursor-pointer rounded-lg p-1 ring-2 ring-[var(--accent-brand)] ring-offset-2 ring-offset-surface" : "cursor-pointer rounded-lg p-1 ring-1 ring-border"}
                  >
                    <FitCard state={thumb} />
                    <span className="mt-1 block truncate text-left text-[11px] text-muted-foreground">{item.name}</span>
                  </div>
                );
              })}
            </div>
            {visible.length === 0 ? <p className="text-sm text-muted-foreground">No template matches that search.</p> : null}
          </Panel>
          <Panel title="Content" className="border-t border-border">
            <details open className="group">
              <summary className="cursor-pointer text-[12.5px] font-medium text-fg2">Fields for {template.name}</summary>
              <div className="mt-3 flex flex-col gap-3">
                {template.fields.map((key) => (
                  <FieldEditor key={key} field={key} value={fields[key]} onChange={(value) => setFields({ ...fields, [key]: value })} counter={key === template.headline ? fit.notice : undefined} warn={key === template.headline && fit.clipped} />
                ))}
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_KEYS.map((item) => (
                    <ColorField key={item.key} label={item.label} value={colors[item.key]} onChange={(value) => setColors({ ...colors, [item.key]: value })} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5" aria-label="Color presets">
                  {template.presets.map((item) => (
                    <ChipButton key={item.name} pressed={sameColors(colors, item.colors)} onClick={() => setColors(item.colors)}>
                      <span className="mr-1 inline-flex gap-0.5" aria-hidden>
                        <i className="size-2.5 rounded-full" style={{ background: item.colors.background, boxShadow: "inset 0 0 0 1px var(--border)" }} />
                        <i className="size-2.5 rounded-full" style={{ background: item.colors.accent }} />
                      </span>
                      {item.name}
                    </ChipButton>
                  ))}
                </div>
                {template.images.map((key) => (
                  <div key={key} className="flex flex-col gap-1">
                    <Dropzone accept="image/png,image/jpeg,image/webp,image/gif" label={IMAGE_LABELS[key]} invalid={Boolean(imageError)} onFile={(file) => takeImage(key, file)} />
                    {images[key] ? <p className="font-mono text-[12px] text-muted-foreground">{key} ready</p> : null}
                  </div>
                ))}
                {imageError ? <p role="alert" className="text-xs text-status-bad">{imageError}</p> : null}
              </div>
            </details>
          </Panel>
        </div>
      }
      output={
        <Panel title="Preview">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ToolTabs label="Card output" value={tab} onChange={setTab} options={[{ value: "preview", label: "Preview" }, { value: "code", label: "opengraph-image.tsx" }, { value: "meta", label: "Meta tags" }]} />
          </div>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Card size">
            {(Object.keys(OG_SIZES) as OgSizeId[]).map((id) => (
              <ChipButton key={id} role="radio" pressed={size === id} onClick={() => setSize(id)}>{OG_SIZES[id].label}</ChipButton>
            ))}
          </div>
          {tab === "preview" ? (
            <>
              <FitCard state={state} />
              <Notice tone={fit.clipped ? "warn" : "ok"} icon={<ImageIcon size={15} />} title={fit.notice} />
              <div className="grid gap-2 min-[700px]:grid-cols-3">
                <SocialMock name="X" mark="𝕏"><FitCard state={state} /></SocialMock>
                <SocialMock name="LinkedIn" mark="in"><FitCard state={state} /></SocialMock>
                <SocialMock name="Slack" mark="#"><FitCard state={state} /></SocialMock>
              </div>
            </>
          ) : null}
          {tab === "code" ? <CodeViewer code={source} filename="opengraph-image.tsx" label="opengraph-image.tsx" language="tsx" maxHeight={560} /> : null}
          {tab === "meta" ? <CodeViewer code={meta} filename="meta.html" label="Meta tags" language="html" /> : null}
        </Panel>
      }
    />
  );
}

function FieldEditor({ field, value, onChange, counter, warn }: { field: FieldKey; value: string; onChange: (value: string) => void; counter?: string; warn?: boolean }) {
  const meta = fieldMeta(field);
  const id = `og-${field}`;
  return (
    <FieldRow label={meta.label} htmlFor={id} help={field === "steps" ? "One step per line." : field === "versions" ? "One version per line, as v2.3 | Note." : undefined} actions={counter ? <span className={warn ? "font-mono text-[12px] text-status-warn" : "font-mono text-[12px] text-faint"}>{counter}</span> : undefined}>
      {meta.kind === "textarea" ? (
        <TextArea id={id} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-24 font-mono text-[13px]" />
      ) : (
        <TextInput id={id} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </FieldRow>
  );
}

function oklchLabel(value: string) {
  const parsed = parse(value);
  const color = parsed ? toOklch(parsed) : undefined;
  if (!color || color.l === undefined || color.c === undefined) return value;
  const hue = color.h === undefined || Number.isNaN(color.h) ? "0.0" : color.h.toFixed(1);
  const alpha = color.alpha !== undefined && color.alpha < 1 ? ` / ${color.alpha.toFixed(2)}` : "";
  return `oklch(${color.l.toFixed(3)} ${color.c.toFixed(3)} ${hue}${alpha})`;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const parsed = parse(value);
  const hex = parsed ? formatHex(parsed) : "#000000";
  const oklch = oklchLabel(value);
  return (
    <label className="flex flex-col gap-1 rounded-lg border border-border p-2">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <ColorInput aria-label={`${label} color`} value={hex} onChange={(event) => onChange(event.target.value)} className="size-8" />
        <span className="size-8 rounded-md border border-border" style={{ background: value }} />
      </span>
      <span className="font-mono text-[11px] text-foreground">{hex}</span>
      <span className="font-mono text-[10px] break-all text-faint">{oklch}</span>
    </label>
  );
}

function FitCard({ state }: { state: OgState }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setWidth(Math.max(1, node.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const scale = width / state.width;
  return (
    <div ref={ref} className="w-full overflow-hidden rounded-md bg-sunken" style={{ height: Math.max(1, state.height * scale) }}>
      <div style={{ width: state.width, height: state.height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {renderOg(state)}
      </div>
    </div>
  );
}

function SocialMock({ name, mark, children }: { name: string; mark: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-2 py-1.5">
        <span className="grid size-4 place-items-center rounded bg-sunken text-[9px] font-semibold">{mark}</span>
        <span className="text-[11px] text-muted-foreground">{name}</span>
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

function sameColors(left: OgColors, right: OgColors) {
  return left.background === right.background && left.foreground === right.foreground && left.accent === right.accent && left.muted === right.muted;
}
