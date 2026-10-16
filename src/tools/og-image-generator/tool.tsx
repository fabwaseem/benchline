"use client";

import { useEffect, useRef, useState } from "react";
import { CodeOutput } from "@/components/kit/code-output";
import { DownloadButton } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { FieldRow } from "@/components/kit/field-row";
import { Segmented } from "@/components/kit/segmented";
import { ToolShell } from "@/components/kit/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildMetaTags, buildOpenGraphFile, ogExample, OG_HEIGHT, OG_WIDTH, templates, type OgInput, type OgTemplate } from "@/tools/og-image-generator/lib/og";

export default function OgTool() {
  const [input, setInput] = useState<OgInput>(ogExample);
  const [logo, setLogo] = useState("");
  const [png, setPng] = useState("");
  const [tab, setTab] = useState<"code" | "meta">("code");
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      wrapText(ctx, input.title, 72, input.template === "minimal" ? 280 : 300, 1000, input.template === "minimal" ? 92 : 72);
      ctx.globalAlpha = 0.78;
      ctx.font = `400 30px ${font}`;
      wrapText(ctx, input.subtitle, 72, 500, 980, 40);
      ctx.globalAlpha = 1;
      ctx.font = `500 24px ${font}`;
      ctx.fillText(input.author, 72, 580);
      if (logo) {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
          ctx.drawImage(image, 1040, 64, 88, 88);
          setPng(canvas.toDataURL("image/png"));
        };
        image.src = logo;
      }
      setPng(canvas.toDataURL("image/png"));
    };
    void draw();
    return () => { cancel = true; };
  }, [input, logo]);

  function download() {
    const link = document.createElement("a");
    link.href = png;
    link.download = "og-image.png";
    link.click();
  }

  const code = tab === "code" ? buildOpenGraphFile(input) : buildMetaTags(input);

  return (
    <ToolShell
      runsLocally
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => { setInput(ogExample); setLogo(""); }}>Reset</Button>
          <Button type="button" onClick={download}>Download PNG</Button>
        </>
      }
    >
      <div className="grid lg:grid-cols-[minmax(0,22rem)_1fr] [&>*]:min-w-0">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:border-r lg:border-b-0">
          <FieldRow label="Template" htmlFor="og-template">
            <Segmented label="Template" value={input.template} onChange={(template) => setInput({ ...input, template })} options={templates.map((template) => ({ value: template as OgTemplate, label: template }))} />
          </FieldRow>
          <FieldRow label="Title" htmlFor="og-title"><Input id="og-title" value={input.title} onChange={(event) => setInput({ ...input, title: event.target.value })} /></FieldRow>
          <FieldRow label="Subtitle" htmlFor="og-sub"><Input id="og-sub" value={input.subtitle} onChange={(event) => setInput({ ...input, subtitle: event.target.value })} /></FieldRow>
          <FieldRow label="Author" htmlFor="og-author"><Input id="og-author" value={input.author} onChange={(event) => setInput({ ...input, author: event.target.value })} /></FieldRow>
          <Segmented label="Font" value={input.font} onChange={(font) => setInput({ ...input, font })} options={[{ value: "sans", label: "Sans" }, { value: "mono", label: "Mono" }]} />
          <div className="grid grid-cols-3 gap-2">
            <ColorField label="Background" value={input.background} onChange={(background) => setInput({ ...input, background })} />
            <ColorField label="Text" value={input.foreground} onChange={(foreground) => setInput({ ...input, foreground })} />
            <ColorField label="Accent" value={input.accent} onChange={(accent) => setInput({ ...input, accent })} />
          </div>
          <Dropzone accept="image/png,image/jpeg,image/webp,image/gif" label="Drop a logo. It stays in this browser." onFile={(file) => {
            const reader = new FileReader();
            reader.onload = () => setLogo(String(reader.result ?? ""));
            reader.readAsDataURL(file);
          }} />
        </div>
        <div className="flex flex-col gap-3 p-4">
          <canvas ref={canvasRef} width={OG_WIDTH} height={OG_HEIGHT} className="hidden" />
          {png ? (
            // The preview is a data URL drawn on this page.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={png} alt="Open Graph preview" className="w-full rounded-lg border border-border" />
          ) : null}
          <p className="text-xs text-muted-foreground tabular-nums">1200 × 630</p>
          <Segmented label="Output" value={tab} onChange={setTab} options={[{ value: "code", label: "opengraph-image.tsx" }, { value: "meta", label: "Meta tags" }]} />
          <CodeOutput code={code} filename={tab === "code" ? "opengraph-image.tsx" : "meta.html"} label={tab === "code" ? "opengraph-image.tsx" : "Meta tags"} />
          <DownloadButton filename="og-meta.txt" content={code} label="Download code" />
        </div>
      </div>
    </ToolShell>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <FieldRow label={label} htmlFor={`og-${label}`}>
      <Input id={`og-${label}`} value={value} onChange={(event) => onChange(event.target.value)} className="font-mono text-xs" />
    </FieldRow>
  );
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let cursor = y;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max) {
      ctx.fillText(line, x, cursor);
      line = word;
      cursor += lineHeight;
    } else {
      line = next;
    }
  }
  ctx.fillText(line, x, cursor);
}
