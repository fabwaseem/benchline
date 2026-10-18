"use client";

import { Input as InputPrimitive } from "@base-ui/react/input";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { IconButton } from "@/components/kit/primitives/icon-button";
import { Kbd } from "@/components/kit/kbd";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-control-lg w-full min-w-0 rounded-sm border border-border-strong bg-surface px-2.5 text-[13px] text-foreground outline-none transition-[box-shadow,border-color] duration-150 placeholder:text-faint focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-destructive min-[700px]:h-control-md";

function Input({
  className,
  prefix,
  suffix,
  kbd,
  clearable = false,
  onClear,
  value,
  ...props
}: Omit<ComponentProps<typeof InputPrimitive>, "prefix" | "suffix"> & {
  prefix?: ReactNode;
  suffix?: ReactNode;
  kbd?: string;
  clearable?: boolean;
  onClear?: () => void;
}) {
  const adorned = Boolean(prefix || suffix || kbd || clearable);
  if (!adorned) {
    return <InputPrimitive data-slot="input" className={cn(fieldClass, className)} value={value} {...props} />;
  }
  const filled = value !== undefined && value !== null && String(value).length > 0;
  return (
    <div
      data-slot="input-wrap"
      className={cn(
        fieldClass,
        "flex items-center gap-2 px-2 focus-within:border-brand focus-within:ring-2 focus-within:ring-ring/40",
        className,
      )}
    >
      {prefix ? <span className="shrink-0 text-faint [&_svg]:size-3.5">{prefix}</span> : null}
      <InputPrimitive
        data-slot="input"
        value={value}
        className="h-full min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-faint"
        {...props}
      />
      {clearable && filled ? <IconButton label="Clear" size="sm" onClick={onClear}><X /></IconButton> : null}
      {kbd ? <Kbd>{kbd}</Kbd> : null}
      {suffix ? <span className="shrink-0 text-faint [&_svg]:size-3.5">{suffix}</span> : null}
    </div>
  );
}

export { Input, fieldClass };
