"use client";

import { File, X } from "lucide-react";
import { IconButton } from "@/components/kit/primitives/icon-button";

export function CompactFilePill({ name, onRemove }: { name: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex h-control-sm max-w-full items-center gap-1.5 rounded-sm border border-border bg-surface px-2 text-[12px]">
      <File className="size-3.5 shrink-0 text-faint" aria-hidden />
      <span className="truncate">{name}</span>
      {onRemove ? <IconButton label={`Remove ${name}`} size="sm" onClick={onRemove}><X /></IconButton> : null}
    </span>
  );
}
