"use client";

import { converter, formatCss, formatHex, formatHsl, formatRgb, parse } from "culori";
import { Pipette } from "lucide-react";
import { useMemo, useSyncExternalStore, type PointerEvent } from "react";
import { Button } from "@/components/kit/primitives/button";
import { IconButton } from "@/components/kit/primitives/icon-button";
import { Input } from "@/components/kit/primitives/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/kit/primitives/popover";
import { cn } from "@/lib/utils";

const toHsv = converter("hsv");
const RECENT_KEY = "benchline.colors";
const PRESETS = ["#E8590C", "#16130F", "#F6F4EF", "#9A3412", "#C2410C", "#1D4ED8", "#0F766E", "#B91C1C", "#A8A29E", "#44403C"];

type Hsv = { h: number; s: number; v: number; alpha: number };
type Channels = { h?: number; s?: number; v?: number; alpha?: number };

function read(value: string): Hsv {
  const parsed = parse(value);
  const hsv = parsed ? (toHsv(parsed) as Channels) : undefined;
  return {
    h: hsv?.h ?? 24,
    s: hsv?.s ?? 1,
    v: hsv?.v ?? 0.55,
    alpha: hsv?.alpha ?? parsed?.alpha ?? 1,
  };
}

function paint(hsv: Hsv) {
  return { mode: "hsv" as const, h: hsv.h, s: hsv.s, v: hsv.v, alpha: hsv.alpha };
}

function cssOf(hsv: Hsv) {
  const color = paint(hsv);
  const next = hsv.alpha < 1 ? formatCss(color) : formatHex(color);
  return next ?? "#E8590C";
}

function channel(hsv: Hsv, mode: "rgb" | "hsl" | "oklch") {
  const color = paint(hsv);
  const converted = converter(mode)(color);
  if (mode === "rgb") return formatRgb(converted) ?? "";
  if (mode === "hsl") return formatHsl(converted) ?? "";
  return formatCss(converted) ?? "";
}

export function ColorSwatch({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-6 rounded-sm border border-border-strong", className)}
      style={{ background: color }}
    />
  );
}

const emptyRecent: string[] = [];
let recentSnapshot = emptyRecent;
let recentLoaded = false;
const recentListeners = new Set<() => void>();

function readRecent() {
  if (typeof window === "undefined") return emptyRecent;
  if (!recentLoaded) {
    recentLoaded = true;
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
      if (Array.isArray(stored)) recentSnapshot = stored.filter((item) => typeof item === "string").slice(0, 8);
    } catch {
      recentSnapshot = emptyRecent;
    }
  }
  return recentSnapshot;
}

function useRecent() {
  const recent = useSyncExternalStore(
    (listener) => {
      recentListeners.add(listener);
      return () => recentListeners.delete(listener);
    },
    readRecent,
    () => emptyRecent,
  );
  function remember(value: string) {
    recentSnapshot = [value, ...recent.filter((item) => item !== value)].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentSnapshot));
    recentListeners.forEach((listener) => listener());
  }
  return { recent, remember };
}

export function ColorPicker({
  value,
  onValueChange,
  label = "Color",
  id,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  id?: string;
  className?: string;
}) {
  const hsv = useMemo(() => read(value), [value]);
  const { recent, remember } = useRecent();
  const eyedropper = typeof window !== "undefined" && "EyeDropper" in window;

  function commit(next: Hsv) {
    onValueChange(cssOf(next));
  }

  function drag(event: PointerEvent<HTMLDivElement>, mode: "sv" | "h" | "a") {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    if (mode === "sv") commit({ ...hsv, s: x, v: 1 - y });
    if (mode === "h") commit({ ...hsv, h: x * 360 });
    if (mode === "a") commit({ ...hsv, alpha: x });
  }

  function pointer(mode: "sv" | "h" | "a") {
    return {
      onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        drag(event, mode);
      },
      onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) drag(event, mode);
      },
    };
  }

  async function pick() {
    const Ctor = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
    if (!Ctor) return;
    const result = await new Ctor().open();
    onValueChange(result.sRGBHex);
    remember(result.sRGBHex);
  }

  return (
    <Popover>
      <PopoverTrigger id={id} aria-label={label} className={cn("inline-flex h-control-md items-center gap-2 rounded-sm border border-border-strong bg-surface px-1.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}>
        <ColorSwatch color={cssOf(hsv)} />
        <span className="font-mono text-[12px]">{formatHex(paint(hsv)) ?? value}</span>
      </PopoverTrigger>
      <PopoverContent className="w-64 gap-2 rounded-xl p-3">
        <div className="relative h-36 cursor-crosshair overflow-hidden rounded-sm" style={{ background: `hsl(${hsv.h} 100% 50%)` }} {...pointer("sv")}>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,white,transparent)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,black,transparent)]" />
          <span className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }} />
        </div>
        <div className="relative h-3 cursor-pointer rounded-sm bg-[linear-gradient(to_right,red,yellow,lime,cyan,blue,magenta,red)]" {...pointer("h")}>
          <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{ left: `${(hsv.h / 360) * 100}%` }} />
        </div>
        <div className="relative h-3 cursor-pointer rounded-sm bg-[linear-gradient(45deg,var(--border)_25%,transparent_25%,transparent_75%,var(--border)_75%),linear-gradient(45deg,var(--border)_25%,transparent_25%,transparent_75%,var(--border)_75%)] bg-[length:8px_8px] bg-[position:0_0,4px_4px]" {...pointer("a")}>
          <div className="absolute inset-0 rounded-sm" style={{ background: `linear-gradient(to right, transparent, ${formatHex(paint(hsv)) ?? "black"})` }} />
          <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{ left: `${hsv.alpha * 100}%` }} />
        </div>
        <div className="flex items-center gap-1">
          {eyedropper ? (
            <IconButton label="Eyedropper" size="sm" variant="outline" onClick={() => void pick()}>
              <Pipette />
            </IconButton>
          ) : null}
          <Input aria-label="Hex" value={formatHex(paint(hsv)) ?? ""} onChange={(event) => { if (parse(event.target.value)) onValueChange(event.target.value); }} onBlur={() => remember(cssOf(hsv))} className="font-mono" />
        </div>
        <div className="grid gap-1">
          {(["rgb", "hsl", "oklch"] as const).map((mode) => (
            <Input
              key={mode}
              aria-label={mode.toUpperCase()}
              value={channel(hsv, mode)}
              onChange={(event) => { if (parse(event.target.value)) onValueChange(event.target.value); }}
              className="font-mono"
              prefix={<span className="w-10 font-mono text-[10px] tracking-wider uppercase">{mode}</span>}
            />
          ))}
        </div>
        <Swatches colors={PRESETS} onPick={(next) => { onValueChange(next); remember(next); }} />
        {recent.length > 0 ? <Swatches colors={recent} onPick={(next) => onValueChange(next)} /> : null}
      </PopoverContent>
    </Popover>
  );
}

function Swatches({ colors, onPick }: { colors: string[]; onPick: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {colors.map((color) => (
        <Button key={color} type="button" variant="ghost" size="icon-sm" aria-label={color} className="h-auto w-auto p-0.5" onClick={() => onPick(color)}>
          <ColorSwatch color={color} />
        </Button>
      ))}
    </div>
  );
}
