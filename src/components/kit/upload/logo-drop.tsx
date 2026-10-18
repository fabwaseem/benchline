"use client";

import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useObjectUrl } from "@/components/kit/upload/object-url";
import { useFileDrop } from "@/components/kit/upload/use-file-drop";

export function LogoDrop({
  file,
  onFile,
  accept = "image/*",
  maxSize,
  label = "Logo",
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  accept?: string;
  maxSize?: number;
  label?: string;
}) {
  const drop = useFileDrop({ accept, maxSize, multiple: false, onFile: (next) => onFile(next) });
  const url = useObjectUrl(file);
  return (
    <div
      {...drop.rootProps}
      aria-label={label}
      className={cn(
        "grid size-16 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-border-strong bg-surface outline-none focus-visible:ring-2 focus-visible:ring-ring",
        drop.dragOver && "border-brand bg-[color-mix(in_srgb,var(--accent-brand)_12%,var(--surface))]",
      )}
    >
      <input {...drop.inputProps} />
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        <Upload className="size-4 text-faint" aria-hidden />
      )}
    </div>
  );
}
