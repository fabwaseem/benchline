"use client";

import { Button } from "@/components/ui/button";

export type BatchItem = {
  id: string;
  name: string;
  status: "queued" | "working" | "done" | "error";
  meta: string;
  error?: string;
  preview?: string;
};

export function BatchList({
  items,
  onRemove,
  onSave,
}: {
  items: BatchItem[];
  onRemove: (id: string) => void;
  onSave: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2" aria-live="polite">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 rounded-lg border border-border px-2 py-2">
          <span
            className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-md bg-muted bg-cover bg-center"
            style={item.preview ? { backgroundImage: `url("${item.preview}")` } : undefined}
          >
            {item.preview ? null : <span className="font-mono text-[10px] text-faint">{item.status}</span>}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm">{item.name}</span>
            <span className={item.error ? "block truncate font-mono text-[12px] text-status-bad" : "block truncate font-mono text-[12px] text-muted-foreground"}>
              {item.error ?? item.meta}
            </span>
          </span>
          <Button type="button" variant="outline" size="sm" disabled={item.status !== "done"} onClick={() => onSave(item.id)}>
            Save
          </Button>
          <Button type="button" variant="ghost" size="sm" aria-label={`Remove ${item.name}`} onClick={() => onRemove(item.id)}>
            Remove
          </Button>
        </li>
      ))}
    </ul>
  );
}
