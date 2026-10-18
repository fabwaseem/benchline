"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

function Switch({
  className,
  size = "md",
  ...props
}: SwitchPrimitive.Root.Props & { size?: "sm" | "md" }) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer relative inline-flex shrink-0 items-center rounded-full border border-transparent outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-checked:bg-brand data-unchecked:bg-border-strong data-disabled:cursor-not-allowed data-disabled:opacity-40 data-[size=md]:h-5 data-[size=md]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-surface shadow-[0_0_0_1px_var(--border)] transition-transform data-unchecked:translate-x-0.5",
          size === "sm" ? "size-3 data-checked:translate-x-3.5" : "size-4 data-checked:translate-x-[18px]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
