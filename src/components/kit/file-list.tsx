"use client";

import type { DragEventHandler, ReactNode } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { ActionButton } from "@/components/kit/controls";

export type FileListItem = {
  id: string;
  name: string;
  meta: string;
  extra?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  onUp?: () => void;
  onDown?: () => void;
  onRemove?: () => void;
  upDisabled?: boolean;
  downDisabled?: boolean;
  onDragStart?: DragEventHandler<HTMLLIElement>;
  onDragOver?: DragEventHandler<HTMLLIElement>;
  onDrop?: DragEventHandler<HTMLLIElement>;
};

export function FileList({ label, items }: { label: string; items: FileListItem[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2" aria-label={label}>
      {items.map((item) => (
        <li
          key={item.id}
          draggable={Boolean(item.onDragStart)}
          onDragStart={item.onDragStart}
          onDragOver={item.onDragOver}
          onDrop={item.onDrop}
          className="rounded-lg border border-border bg-surface px-2 py-2"
        >
          <div className="flex items-center gap-2">
            {item.leading}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{item.name}</div>
              <div className="font-mono text-[12px] text-muted-foreground">{item.meta}</div>
            </div>
            {item.trailing}
            {item.onUp ? (
              <ActionButton variant="ghost" size="icon-sm" aria-label={`Move ${item.name} up`} disabled={item.upDisabled} onClick={item.onUp}>
                <ChevronUp size={15} />
              </ActionButton>
            ) : null}
            {item.onDown ? (
              <ActionButton variant="ghost" size="icon-sm" aria-label={`Move ${item.name} down`} disabled={item.downDisabled} onClick={item.onDown}>
                <ChevronDown size={15} />
              </ActionButton>
            ) : null}
            {item.onRemove ? (
              <ActionButton variant="ghost" size="icon-sm" aria-label={`Remove ${item.name}`} onClick={item.onRemove}>
                <X size={15} />
              </ActionButton>
            ) : null}
          </div>
          {item.extra ? <div className="mt-2">{item.extra}</div> : null}
        </li>
      ))}
    </ul>
  );
}
