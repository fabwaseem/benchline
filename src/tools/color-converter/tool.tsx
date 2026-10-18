"use client";

import { useMemo, useState } from "react";
import { Palette } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CopyButton } from "@/components/kit/copy-button";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { Input } from "@/components/ui/input";
import { contrastPair, convertColor } from "@/tools/color-converter/lib/color";

const SAMPLES = ["#2563eb", "#ff0000", "rebeccapurple", "oklch(72% 0.14 160)", "cmyk(0%, 100%, 100%, 0%)"];

export default function ColorConverterTool() {
  const params = useSearchParams();
  const [raw, setRaw] = useState(params.get("color") || "#2563eb");
  const [background, setBackground] = useState(params.get("bg") || "#ffffff");
  const color = useMemo(() => convertColor(raw), [raw]);
  const contrast = useMemo(() => contrastPair(raw, background), [raw, background]);
  const back = useMemo(() => convertColor(background), [background]);

  useWorkbenchKeys({
    onEscape: () => {
      setRaw("#2563eb");
      setBackground("#ffffff");
    },
  });

  const rows = color
    ? [
        { label: "HEX", value: color.hex },
        { label: "RGB", value: color.rgb },
        { label: "HSL", value: color.hsl },
        { label: "OKLCH", value: color.oklch },
        { label: "CMYK", value: color.cmyk },
      ]
    : [];

  return (
    <ToolShell
      runsLocally
      layout="split+inspector"
      flow="band"
      tabs={<ToolTabs label="Mode" value="convert" onChange={() => {}} options={[{ value: "convert", label: "Convert" }]} />}
      actions={
        <InkButton
          icon={<Palette size={15} />}
          disabled={!color}
          onClick={() => {
            if (!color) return;
            void navigator.clipboard.writeText(color.hex).then(() => toast.success("HEX copied"));
          }}
        >
          Copy HEX
        </InkButton>
      }
      status={
        <>
          <span className={color ? "dot" : "dot dot-warn"} />
          <span>{color ? `${color.hex} · ${color.tailwind || "no token"}` : "That color could not be read"}</span>
          <span className="ml-auto hidden min-[700px]:inline">Runs in this browser</span>
        </>
      }
      input={
        <Panel title="Color">
          <FieldRow label="Any color" htmlFor="color-input" error={color ? undefined : "Use HEX, rgb(), hsl(), oklch(), cmyk(), or a CSS name."} help="One value fills every format.">
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Pick a color"
                value={color?.hex ?? "#000000"}
                onChange={(event) => setRaw(event.target.value)}
                className="size-11 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent"
              />
              <Input id="color-input" value={raw} onChange={(event) => setRaw(event.target.value)} className="font-mono max-[699px]:h-11" aria-invalid={!color} />
            </div>
          </FieldRow>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLES.map((sample) => (
              <button key={sample} type="button" className="chip font-mono" data-on={raw === sample ? "true" : "false"} onClick={() => setRaw(sample)}>
                {sample}
              </button>
            ))}
          </div>
          {color ? (
            <div className="flex flex-col gap-2">
              {rows.map((row) => (
                <div key={row.label} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <span className="w-14 text-[12px] text-muted-foreground">{row.label}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-sm">{row.value}</span>
                  <CopyButton value={row.value} label="Copy" toastMessage={`${row.label} copied`} />
                </div>
              ))}
            </div>
          ) : (
            <Notice tone="bad" role="alert" title="That value is not a color this page can read." />
          )}
        </Panel>
      }
      output={
        <Panel title="Swatch">
          <div
            className="flex min-h-48 flex-col justify-end rounded-xl border border-border p-5"
            style={{ background: contrast?.foreground ?? "transparent" }}
          >
            <p className="font-mono text-sm" style={{ color: contrast?.background ?? "transparent" }}>
              {color ? color.hex : "—"}
            </p>
          </div>
          {color ? (
            <p className="text-sm text-muted-foreground">
              Nearest Tailwind token: <span className="font-mono text-foreground">{color.tailwind || "none"}</span>
            </p>
          ) : null}
        </Panel>
      }
      inspector={
        <Panel title="Contrast">
          <FieldRow label="Background" htmlFor="bg-input" error={back ? undefined : "The background is not a color."}>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Pick a background"
                value={back?.hex ?? "#ffffff"}
                onChange={(event) => setBackground(event.target.value)}
                className="size-11 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent"
              />
              <Input id="bg-input" value={background} onChange={(event) => setBackground(event.target.value)} className="font-mono max-[699px]:h-11" aria-invalid={!back} />
            </div>
          </FieldRow>
          {contrast ? (
            <>
              <ResultStat variant="well" label="Contrast ratio" value={contrast.ratioText} hint="WCAG 2, after flattening transparency" />
              <div
                className="rounded-lg border border-border px-4 py-4"
                style={{ background: contrast.background, color: contrast.foreground }}
              >
                <p className="text-sm">The quick brown fox jumps over the lazy dog.</p>
                <p className="text-2xl font-semibold tracking-tight">Large text</p>
              </div>
              <ul className="grid grid-cols-2 gap-2 text-sm">
                <Grade pass={contrast.aaNormal} label="AA normal" />
                <Grade pass={contrast.aaLarge} label="AA large" />
                <Grade pass={contrast.aaaNormal} label="AAA normal" />
                <Grade pass={contrast.aaaLarge} label="AAA large" />
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Contrast shows up when both colors can be read.</p>
          )}
        </Panel>
      }
    />
  );
}

function Grade({ pass, label }: { pass: boolean; label: string }) {
  return (
    <li className={pass ? "rounded-lg border border-border px-3 py-2 text-status-ok" : "rounded-lg border border-border px-3 py-2 text-status-bad"}>
      {label}
      <span className="mt-0.5 block font-mono text-[12px]">{pass ? "Pass" : "Fail"}</span>
    </li>
  );
}
