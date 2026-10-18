"use client";

import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ActionVariant = "default" | "outline" | "ghost";
type ActionSize = "default" | "sm" | "xs" | "icon" | "icon-sm";

export function ActionButton({
  variant = "default",
  size = "default",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ActionVariant; size?: ActionSize }) {
  const custom = className?.split(/\s+/).includes("btn");
  return (
    <button
      type={type}
      className={cn(
        "disabled:pointer-events-none disabled:opacity-40",
        custom
          ? className
          : cn(
              "btn",
              variant === "default" && "btn-ink",
              variant === "ghost" && "btn-ghost",
              size === "sm" && "h-7 px-2.5 text-[12.5px]",
              size === "xs" && "h-6 px-2 text-[12px]",
              (size === "icon" || size === "icon-sm") && "p-0",
              size === "icon" && "size-8",
              size === "icon-sm" && "size-7",
              className,
            ),
      )}
      {...props}
    />
  );
}

export function ChipButton({
  pressed,
  className,
  type = "button",
  role,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean }) {
  return (
    <button
      type={type}
      role={role}
      data-on={pressed === undefined ? undefined : pressed ? "true" : "false"}
      aria-pressed={role === "radio" || pressed === undefined ? undefined : pressed}
      aria-checked={role === "radio" ? Boolean(pressed) : undefined}
      className={cn("chip", className)}
      {...props}
    />
  );
}

export function IconButton({
  label,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "grid size-7 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-sunken hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function TextButton({ className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        "text-left text-[12.5px] text-muted-foreground underline-offset-2 transition-colors duration-150 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  );
}

const fieldClass =
  "w-full min-w-0 rounded-lg border border-border bg-surface px-2.5 text-sm text-foreground outline-none transition-[box-shadow,border-color] duration-150 placeholder:text-faint focus-visible:border-brand-text focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive";

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput({ className, ...props }, ref) {
  return <input ref={ref} className={cn(fieldClass, "h-9 max-[699px]:h-11", className)} {...props} />;
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(fieldClass, "min-h-24 py-2 leading-6", className)} {...props} />;
});

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(fieldClass, "h-9 bg-surface pr-8 max-[699px]:h-11", className)}
      {...props}
    />
  );
}

export function ColorInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="color"
      className={cn("size-11 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent", className)}
      {...props}
    />
  );
}

export function Toggle({
  checked,
  onCheckedChange,
  className,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-[18px] w-8 shrink-0 rounded-full transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-40",
        checked ? "bg-brand" : "bg-border-strong",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none mt-px ml-px block size-4 rounded-full bg-surface shadow-[0_0_0_1px_var(--border)] transition-transform duration-150",
          checked && "translate-x-[14px]",
        )}
      />
    </button>
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
    <div className="flex min-h-11 items-center justify-between gap-3 text-sm">
      <span>
        {label}
        {hint ? <span className="mt-0.5 block text-[12px] text-faint">{hint}</span> : null}
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
  const span = max - min || 1;
  const pct = `${((current - min) / span) * 100}%`;
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      value={current}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={current}
      onChange={(event) => onValueChange?.([Number(event.target.value)])}
      className={cn("kit-range h-8 w-full cursor-pointer", className)}
      style={{ ["--pct" as string]: pct }}
    />
  );
}
