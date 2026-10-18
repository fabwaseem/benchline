"use client";

import { forwardRef, type ButtonHTMLAttributes, type ChangeEvent, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Button } from "@/components/kit/primitives/button";
import { ColorPicker } from "@/components/kit/primitives/color-picker";
import { IconButton } from "@/components/kit/primitives/icon-button";
import { Input } from "@/components/kit/primitives/input";
import { Slider as SliderPrimitive } from "@/components/kit/primitives/slider";
import { Switch } from "@/components/kit/primitives/switch";
import { Textarea } from "@/components/kit/primitives/textarea";
import { Toggle as TogglePrimitive } from "@/components/kit/primitives/toggle";
import { cn } from "@/lib/utils";

type ActionVariant = "default" | "outline" | "ghost";
type ActionSize = "default" | "sm" | "xs" | "icon" | "icon-sm";

const legacy = new Set(["btn", "btn-ink", "btn-accent", "btn-brand", "btn-ghost", "btn-lg", "h-8", "h-7", "h-11", "h-[30px]"]);

export function ActionButton({
  variant = "default",
  size = "default",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ActionVariant; size?: ActionSize }) {
  const tokens = className?.split(/\s+/).filter(Boolean) ?? [];
  const names = new Set(tokens);
  const mappedVariant = names.has("btn-accent") || names.has("btn-brand") ? "primary" : names.has("btn-ghost") || variant === "ghost" ? "ghost" : variant === "outline" ? "outline" : "solid";
  const mappedSize = names.has("btn-lg") ? "lg" : size === "xs" || size === "sm" ? "sm" : size === "icon" ? "icon" : size === "icon-sm" ? "icon-sm" : "md";
  const clean = tokens.filter((token) => !legacy.has(token)).join(" ");
  return <Button type={type} variant={mappedVariant} size={mappedSize} className={clean} {...props} />;
}

export function ChipButton({
  pressed,
  className,
  type = "button",
  children,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> & { pressed?: boolean }) {
  return (
    <TogglePrimitive
      type={type}
      pressed={pressed}
      className={cn("chip h-control-sm", className)}
      {...props}
    >
      {children}
    </TogglePrimitive>
  );
}

export function IconButtonControl({
  label,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <IconButton label={label} className={className} {...props} />;
}

export { IconButtonControl as IconButton };

export function TextButton({ className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <Button type={type} variant="link" size="sm" className={cn("h-auto px-0", className)} {...props} />;
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput({ className, ...props }, ref) {
  return <Input ref={ref} className={className} {...props} />;
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea({ className, ...props }, ref) {
  return <Textarea ref={ref} className={className} {...props} />;
});

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-control-lg w-full min-w-0 rounded-sm border border-border-strong bg-surface px-2.5 text-[13px] text-foreground outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-40 min-[700px]:h-control-md",
        className,
      )}
      {...props}
    />
  );
}

export function ColorInput({
  value,
  onChange,
  id,
  className,
  "aria-label": ariaLabel,
}: InputHTMLAttributes<HTMLInputElement>) {
  const current = typeof value === "string" && value ? value : "#16130F";
  return (
    <ColorPicker
      id={id}
      label={typeof ariaLabel === "string" ? ariaLabel : "Color"}
      className={className}
      value={current}
      onValueChange={(next) => onChange?.({ target: { value: next } } as ChangeEvent<HTMLInputElement>)}
    />
  );
}

export function Toggle({
  checked,
  onCheckedChange,
  className,
  disabled,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={className}
      aria-label={props["aria-label"]}
    />
  );
}

export function OptionRow({
  label,
  checked,
  onChange,
  hint,
  children,
}: {
  label: ReactNode;
  checked?: boolean;
  onChange?: (value: boolean) => void;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 text-[13px]">
      <span>
        {label}
        {hint ? <span className="mt-1 block text-[12px] text-faint">{hint}</span> : null}
      </span>
      {onChange ? <Toggle checked={Boolean(checked)} onCheckedChange={onChange} /> : children}
    </div>
  );
}

export function Slider({
  id,
  value,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  className,
  onValueChange,
}: {
  id?: string;
  value?: number[];
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  onValueChange?: (value: number[]) => void;
}) {
  const current = value?.[0] ?? min;
  return (
    <SliderPrimitive
      id={id}
      value={[current]}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      showValue
      className={className}
      onValueChange={(next) => {
        const list = Array.isArray(next) ? [...next] : [next];
        onValueChange?.(list);
      }}
    />
  );
}
