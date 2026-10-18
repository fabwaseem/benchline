"use client";

import { Upload } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useFileDrop, type UseFileDropOptions } from "@/components/kit/upload/use-file-drop";

export function Dropzone({
  accept,
  label,
  hint,
  onFile,
  onFiles,
  onUrl,
  multiple = false,
  invalid = false,
  maxSize,
  maxFiles,
  disabled = false,
  windowDrop = false,
  active,
  className,
  children,
}: UseFileDropOptions & {
  label: ReactNode;
  hint?: ReactNode;
  invalid?: boolean;
  active?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const drop = useFileDrop({ accept, maxSize, maxFiles, multiple, disabled, windowDrop, onFile, onFiles, onUrl });
  const over = active || drop.dragOver;
  const error = drop.errors[0]?.message;
  return (
    <>
      <div
        {...drop.rootProps}
        aria-invalid={invalid || Boolean(error) || undefined}
        className={cn(
          "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface px-4 py-6 text-center text-[13px] text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
          over && "border-brand bg-[color-mix(in_srgb,var(--accent-brand)_10%,var(--surface))] text-brand-text",
          (invalid || error) && "border-destructive",
          disabled && "pointer-events-none opacity-40",
          className,
        )}
      >
        <input {...drop.inputProps} />
        <Upload className={cn("size-5", over && "text-brand")} aria-hidden />
        <span className="font-medium text-foreground">{over ? "Release to upload" : label}</span>
        {hint ? <span className="text-[12px] text-faint">{hint}</span> : null}
        {children}
        {error ? <span className="text-[12px] text-status-bad">{error}</span> : null}
      </div>
      {windowDrop && drop.windowOver ? (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-background/80">
          <div className="rounded-xl border border-dashed border-brand bg-surface px-8 py-6 text-sm font-medium text-brand-text">Release to upload</div>
        </div>
      ) : null}
    </>
  );
}

export function FileButton({
  accept,
  label,
  onFile,
  onFiles,
  multiple = false,
  className,
  maxSize,
  maxFiles,
}: UseFileDropOptions & { label: string; className?: string }) {
  const drop = useFileDrop({ accept, onFile, onFiles, multiple, maxSize, maxFiles });
  return (
    <div {...drop.rootProps} className={cn("btn h-control-md cursor-pointer", className)}>
      <input {...drop.inputProps} />
      {label}
      {drop.errors[0] ? <span className="sr-only">{drop.errors[0].message}</span> : null}
    </div>
  );
}

export function FileUpload(props: UseFileDropOptions & { label: string; hint?: string; invalid?: boolean }) {
  return <Dropzone {...props} multiple={false} />;
}
