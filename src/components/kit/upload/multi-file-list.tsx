"use client";

import { GripVertical, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { IconButton } from "@/components/kit/primitives/icon-button";
import { Progress } from "@/components/kit/primitives/progress";
import { cn } from "@/lib/utils";

export type MultiFileItem = {
  id: string;
  name: string;
  meta?: string;
  progress?: number;
  error?: string;
  leading?: ReactNode;
};

export function MultiFileList({
  items,
  label = "Files",
  onRemove,
  onReorder,
}: {
  items: MultiFileItem[];
  label?: string;
  onRemove?: (id: string) => void;
  onReorder?: (from: number, to: number) => void;
}) {
  const [over, setOver] = useState<number | null>(null);
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2" aria-label={label}>
      {items.map((item, index) => (
        <li
          key={item.id}
          draggable={Boolean(onReorder)}
          onDragStart={(event) => {
            event.dataTransfer.setData("text/plain", String(index));
            event.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(event) => {
            if (!onReorder) return;
            event.preventDefault();
            setOver(index);
          }}
          onDrop={(event) => {
            event.preventDefault();
            const from = Number(event.dataTransfer.getData("text/plain"));
            setOver(null);
            if (Number.isInteger(from) && from !== index) onReorder?.(from, index);
          }}
          className={cn("rounded-xl border border-border bg-surface px-2 py-2", over === index && "border-brand")}
        >
          <div className="flex items-center gap-2">
            {onReorder ? (
              <span className="grid size-7 place-items-center text-faint" aria-hidden>
                <GripVertical className="size-3.5" />
              </span>
            ) : null}
            {item.leading}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{item.name}</div>
              {item.meta ? <div className="font-mono text-[12px] text-muted-foreground">{item.meta}</div> : null}
            </div>
            {onRemove ? <IconButton label={`Remove ${item.name}`} size="sm" onClick={() => onRemove(item.id)}><X /></IconButton> : null}
          </div>
          {typeof item.progress === "number" ? <Progress className="mt-2" value={item.progress} label="Upload" /> : null}
          {item.error ? <p className="mt-1 text-xs text-status-bad">{item.error}</p> : null}
        </li>
      ))}
    </ul>
  );
}
