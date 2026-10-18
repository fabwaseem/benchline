"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "@/lib/utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  showValue = false,
  ...props
}: SliderPrimitive.Root.Props & { showValue?: boolean }) {
  const current = Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min];
  const thumbs = current.length > 0 ? current : [min];
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <SliderPrimitive.Root
        className="relative flex w-full touch-none items-center select-none data-disabled:opacity-40"
        data-slot="slider"
        defaultValue={defaultValue}
        value={value}
        min={min}
        max={max}
        thumbAlignment="edge"
        {...props}
      >
        <SliderPrimitive.Control className="relative flex w-full items-center">
          <SliderPrimitive.Track data-slot="slider-track" className="relative h-1 w-full grow overflow-hidden rounded-sm bg-border-strong">
            <SliderPrimitive.Indicator data-slot="slider-range" className="h-full bg-brand" />
          </SliderPrimitive.Track>
          {thumbs.map((_, index) => (
            <SliderPrimitive.Thumb
              key={index}
              data-slot="slider-thumb"
              className="block size-4 rounded-full border border-border-strong bg-surface shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          ))}
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
      {showValue ? <span className="w-10 shrink-0 text-right font-mono text-[12px] text-muted-foreground tabular-nums">{thumbs[thumbs.length - 1]}</span> : null}
    </div>
  );
}

export { Slider };
