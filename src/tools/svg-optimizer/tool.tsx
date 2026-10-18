"use client";

import { useMemo, useState } from "react";
import { FileCode } from "lucide-react";
import { toast } from "sonner";
import { downloadText } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ActionButton, OptionRow, Slider, TextArea } from "@/components/kit/controls";
import { CodeOutput } from "@/components/kit/code-output";
import { SizeStat } from "@/components/kit/result-stat";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { formatBytes } from "@/lib/image-format";
import { defaultSvgOptions, svgConfig, svgPluginIds, svgPluginLabels, svgSavings, textBytes, type SvgOptions } from "@/tools/svg-optimizer/lib/svg";

const SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <!-- sample -->
  <rect width="64.000" height="64.000" fill="#336699"/>
  <circle cx="32" cy="32" r="12.500" fill="#ffffff"/>
</svg>`;

export default function SvgOptimizerTool() {
  const [source, setSource] = useState(SAMPLE);
  const [options, setOptions] = useState<SvgOptions>(defaultSvgOptions);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const preview = useMemo(() => (output ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(output)}` : ""), [output]);
  const saved = output ? svgSavings(source, output) : null;

  async function optimizeNow() {
    setBusy(true);
    setError("");
    try {
      const { optimize } = await import("svgo/browser");
      const next = optimize(source, svgConfig(options)).data;
      setOutput(next);
    } catch {
      setOutput("");
      setError("This SVG could not be optimized.");
    } finally {
      setBusy(false);
    }
  }

  function loadFile(file: File) {
    if (file.size > 1_500_000) {
      setError("SVG files larger than 1.5 MB stay out of this page.");
      return;
    }
    void file.text().then((text) => {
      setSource(text);
      setOutput("");
      setError("");
    });
  }

  useWorkbenchKeys({
    onEnter: () => void optimizeNow(),
    onCopy: () => { if (output) void navigator.clipboard.writeText(output).then(() => toast.success("Copied")); },
  });

  return (
    <ToolCard>
      <ToolToolbar
        actions={
          <>
            <ActionButton className="btn btn-ink" disabled={busy || !source.trim()} onClick={() => void optimizeNow()}>{busy ? "Optimizing" : "Optimize"}</ActionButton>
            {output ? <ActionButton variant="outline" onClick={() => downloadText("image.svg", output, "image/svg+xml")}>Download SVG</ActionButton> : null}
          </>
        }
      />
      <ToolPanes ratio="40/60">
        <Pane label="Markup">
          <Notice tone="neutral" title="Nothing is uploaded." body="The viewBox stays unless you turn that pass on. Scripts are always removed." />
          <Dropzone accept=".svg,image/svg+xml" label="Drop an .svg, or paste markup below" onFile={loadFile} />
          <FieldRow label="SVG" htmlFor="svg-source">
            <TextArea id="svg-source" value={source} onChange={(event) => setSource(event.target.value)} className="min-h-40 font-mono text-xs" spellCheck={false} />
          </FieldRow>
          <FieldRow label="Precision" htmlFor="svg-precision" help="Decimal places kept in paths and transforms.">
            <Slider id="svg-precision" min={0} max={8} step={1} value={[options.precision]} onValueChange={([value]) => setOptions({ ...options, precision: value ?? 3 })} />
          </FieldRow>
          {svgPluginIds.map((id) => (
            <OptionRow
              key={id}
              label={svgPluginLabels[id]}
              checked={options.plugins[id] !== false}
              onChange={(checked) => setOptions({ ...options, plugins: { ...options.plugins, [id]: checked } })}
            />
          ))}
          <OptionRow label="Remove viewBox" hint="Can change how the SVG scales." checked={options.removeViewBox} onChange={(checked) => setOptions({ ...options, removeViewBox: checked })} />
          <OptionRow label="Remove width and height" checked={options.removeDimensions} onChange={(checked) => setOptions({ ...options, removeDimensions: checked })} />
        </Pane>
        <Pane label="Optimized" scroll={false} bodyClassName="flex min-h-[320px] flex-col gap-3 p-3">
          {error ? <Notice tone="bad" role="alert" title="Not optimized" body={error} /> : null}
          {saved ? <SizeStat before={formatBytes(saved.beforeBytes)} after={formatBytes(saved.afterBytes)} hint={`${Math.round(saved.savedPercent)}% ${saved.savedBytes >= 0 ? "smaller" : "larger"}`} /> : null}
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Optimized SVG preview" className="max-h-56 w-full rounded-lg border border-border bg-background object-contain p-3" />
          ) : (
            <EmptyState art={<FileCode size={22} />} title="No output yet" hint="Optimize the sample, or drop your own SVG." />
          )}
          {output ? <CodeOutput code={output} filename="image.svg" label="SVG" fill chrome={false} className="min-h-0 flex-1" /> : null}
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={error || (saved ? `${formatBytes(saved.beforeBytes)} → ${formatBytes(saved.afterBytes)}` : `${formatBytes(textBytes(source))} in`)}
        tone={error ? "warn" : saved ? "pass" : "info"}
        trailing="Runs in this browser"
        items={saved ? [{ level: saved.savedBytes >= 0 ? "pass" : "warn", label: `${Math.round(saved.savedPercent)}%`, detail: saved.savedBytes >= 0 ? "smaller" : "larger" }] : undefined}
      />
    </ToolCard>
  );
}
