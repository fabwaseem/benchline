"use client";

import { useEffect, useRef, useState } from "react";
import { ActionButton, TextInput } from "@/components/kit/controls";
import { ImageIcon, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { CodeOutput } from "@/components/kit/code-output";
import { downloadText } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { buildMetaTags, buildOpenGraphFile, ogExample, OG_HEIGHT, OG_WIDTH, templates, titleFit, type OgInput, type OgTemplate } from "@/tools/og-image-generator/lib/og";

const LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export default function OgTool() {
  const [input, setInput] = useState<OgInput>(ogExample);
  const [logo, setLogo] = useState("");
  const [logoName, setLogoName] = useState("");
  const [logoBytes, setLogoBytes] = useState(0);
  const [logoError, setLogoError] = useState("");
  const [png, setPng] = useState("");
  const [view, setView] = useState<"preview" | "code" | "meta">("preview");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fit = titleFit(input.title);
  const code = view === "meta" ? buildMetaTags(input) : buildOpenGraphFile(input);
  const pristine = !logo && !logoError && JSON.stringify(input) === JSON.stringify(ogExample);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancel = false;
    const draw = async () => {
      await document.fonts.ready;
      if (cancel) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const font = input.font === "mono" ? "Geist Mono, ui-monospace, monospace" : "Geist, ui-sans-serif, sans-serif";
      ctx.clearRect(0, 0, OG_WIDTH, OG_HEIGHT);
      if (input.template === "gradient") {
        const gradient = ctx.createLinearGradient(0, 0, OG_WIDTH, OG_HEIGHT);
        gradient.addColorStop(0, input.background);
        gradient.addColorStop(1, input.accent);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = input.background;
      }
      ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);
      if (input.template === "blog" || input.template === "product") {
        ctx.fillStyle = input.accent;
        ctx.fillRect(0, 0, input.template === "blog" ? 16 : 0, OG_HEIGHT);
      }
      ctx.fillStyle = input.accent;
      ctx.font = `600 22px ${font}`;
      ctx.fillText(input.template.toUpperCase(), 72, 96);
      ctx.fillStyle = input.foreground;
      ctx.font = `650 ${input.template === "minimal" ? 84 : 64}px ${font}`;
      wrapText(ctx, input.title, 72, input.template === "minimal" ? 280 : 300, 1000, input.template === "minimal" ? 92 : 72, 2);
      ctx.globalAlpha = 0.78;
      ctx.font = `400 30px ${font}`;
      wrapText(ctx, input.subtitle, 72, 500, 980, 40);
      ctx.globalAlpha = 1;
      ctx.font = `500 24px ${font}`;
      ctx.fillText(input.author, 72, 580);
      const finish = () => {
        if (cancel) return;
        setPng(canvas.toDataURL("image/png"));
      };
      if (logo) {
        const image = new Image();
        image.onload = () => {
          ctx.drawImage(image, 1040, 64, 88, 88);
          finish();
        };
        image.src = logo;
        return;
      }
      finish();
    };
    void draw();
    return () => {
      cancel = true;
    };
  }, [input, logo]);

  function download() {
    if (!png) return;
    const link = document.createElement("a");
    link.href = png;
    link.download = "og-image.png";
    link.click();
    toast.success("Downloaded");
  }

  function reset() {
    setInput(ogExample);
    setLogo("");
    setLogoName("");
    setLogoBytes(0);
    setLogoError("");
  }

  function takeLogo(file: File) {
    const named = LOGO_TYPES.has(file.type) || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
    if (!named) {
      setLogo("");
      setLogoBytes(0);
      setLogoName(file.name);
      setLogoError(`${file.name} is not a PNG, JPEG, WebP, or GIF. Pick one of those.`);
      return;
    }
    setLogoError("");
    setLogoName(file.name);
    setLogoBytes(file.size);
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  useWorkbenchKeys({
    onEnter: download,
    onCopy: () => {
      void navigator.clipboard.writeText(code).then(() => toast.success("Code copied"));
    },
    onEscape: () => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    },
  });

  const status = logoError
    ? `Logo rejected · ${logoName}`
    : fit.clipped
      ? "Title clipped at line 2"
      : pristine
        ? "Default card · edit any field"
        : `${input.template} · ${input.font} · ${logoBytes ? `${logoBytes.toLocaleString("en-US")} B` : "no logo"}`;

  return (
    <ToolCard>
      <ToolToolbar
        label="Template"
        options={templates.map((template) => ({ value: template, label: template[0]?.toUpperCase() + template.slice(1) }))}
        value={input.template}
        onChange={(template) => setInput({ ...input, template: template as OgTemplate })}
        actions={
          <>
            <ActionButton type="button" variant="outline" onClick={reset}><RotateCcw size={14} /> Reset</ActionButton>
            <ActionButton type="button" className="btn btn-ink" onClick={download}>Download PNG</ActionButton>
          </>
        }
      />
      <ToolPanes ratio="40/60">
        <Pane label="Compose">
          <FieldRow
            label="Title"
            htmlFor="og-title"
            actions={<span className={fit.clipped ? "font-mono text-[12px] whitespace-nowrap text-status-warn" : "font-mono text-[12px] whitespace-nowrap text-faint"}>{fit.counter}</span>}
          >
            <TextInput id="og-title" value={input.title} onChange={(event) => setInput({ ...input, title: event.target.value })} />
          </FieldRow>
          <FieldRow label="Subtitle" htmlFor="og-sub">
            <TextInput id="og-sub" value={input.subtitle} onChange={(event) => setInput({ ...input, subtitle: event.target.value })} />
          </FieldRow>
          <FieldRow label="Author" htmlFor="og-author">
            <TextInput id="og-author" value={input.author} onChange={(event) => setInput({ ...input, author: event.target.value })} />
          </FieldRow>
          <Segmented label="Font" value={input.font} onChange={(font) => setInput({ ...input, font })} options={[{ value: "sans", label: "Sans" }, { value: "mono", label: "Mono" }]} />
          <div className="grid grid-cols-3 gap-2">
            <ColorField label="Background" value={input.background} onChange={(background) => setInput({ ...input, background })} />
            <ColorField label="Text" value={input.foreground} onChange={(foreground) => setInput({ ...input, foreground })} />
            <ColorField label="Accent" value={input.accent} onChange={(accent) => setInput({ ...input, accent })} />
          </div>
          <Dropzone accept="image/png,image/jpeg,image/webp,image/gif" label="Drop a logo. It stays in this browser." invalid={Boolean(logoError)} onFile={takeLogo} />
          {logoError ? <p role="alert" className="text-xs text-status-bad">{logoError}</p> : null}
          {logoName && !logoError ? <p className="truncate font-mono text-[12px] text-muted-foreground" title={`${logoName} · ${logoBytes.toLocaleString("en-US")} B`}>{logoName} · {logoBytes.toLocaleString("en-US")} B</p> : null}
        </Pane>
        <Pane label="Preview" scroll={false} bodyClassName="flex min-h-[320px] flex-col gap-3 p-3">
          <canvas ref={canvasRef} width={OG_WIDTH} height={OG_HEIGHT} className="hidden" />
          <Segmented label="Preview" value={view} onChange={setView} options={[{ value: "preview", label: "Preview" }, { value: "code", label: "opengraph-image.tsx" }, { value: "meta", label: "Meta tags" }]} />
          {view === "preview" ? (
            <>
              {png ? (
                // The preview is a data URL drawn on this page.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={png} alt="Open Graph preview at 1200 by 630" className="w-full rounded-xl border border-border" />
              ) : null}
              <div aria-live="polite">
                {logoError ? (
                  <Notice tone="bad" role="alert" icon={<ImageIcon size={15} />} title={logoError} />
                ) : (
                  <Notice tone={fit.clipped ? "warn" : "ok"} icon={<ImageIcon size={15} />} title={fit.notice} />
                )}
              </div>
            </>
          ) : (
            <>
              <CodeOutput code={code} filename={view === "code" ? "opengraph-image.tsx" : "meta.html"} label={view === "code" ? "opengraph-image.tsx" : "Meta tags"} fill className="min-h-0 flex-1" />
              <ActionButton type="button" variant="outline" onClick={() => downloadText(view === "code" ? "opengraph-image.tsx" : "meta.html", code)}>
                Download code
              </ActionButton>
            </>
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip note={`1200 × 630 · ${status}`} tone={logoError || fit.clipped ? "warn" : "pass"} trailing="⌘↵ download PNG · ⌘⇧C copy code · esc blur" />
    </ToolCard>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <FieldRow label={label} htmlFor={`og-${label}`}>
      <TextInput id={`og-${label}`} value={value} onChange={(event) => onChange(event.target.value)} className="font-mono text-xs max-[699px]:h-11" />
    </FieldRow>
  );
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lineHeight: number, maxLines = Infinity) {
  const words = text.split(" ").filter(Boolean);
  let line = "";
  let cursor = y;
  let lines = 0;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > max) {
      lines += 1;
      if (lines >= maxLines) {
        ctx.fillText(ellipsis(ctx, line, max), x, cursor);
        return;
      }
      ctx.fillText(line, x, cursor);
      line = word;
      cursor += lineHeight;
    } else {
      line = next;
    }
  }
  if (line) ctx.fillText(line, x, cursor);
}

function ellipsis(ctx: CanvasRenderingContext2D, line: string, max: number) {
  let value = line;
  while (value.length > 1 && ctx.measureText(`${value}…`).width > max) value = value.slice(0, -1);
  return `${value}…`;
}
