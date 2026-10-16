import { cn } from "@/lib/utils";

export type KvItem = {
  name: string;
  value: string;
  hint?: string;
  sub?: string;
  tone?: "warn" | "bad";
};

export function KvList({ items }: { items: KvItem[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li
          key={item.name}
          className={cn(
            "grid grid-cols-[44px_minmax(0,1fr)_auto] items-baseline gap-3 border-t border-border px-4 py-2 text-[13px]",
            item.tone === "warn" && "bg-[color-mix(in_srgb,var(--warning)_7%,transparent)]",
            item.tone === "bad" && "bg-[color-mix(in_srgb,var(--danger)_6%,transparent)]",
          )}
        >
          <span className="font-mono text-muted-foreground">{item.name}</span>
          <div className="min-w-0">
            <span className="font-mono break-all text-foreground">{item.value}</span>
            {item.sub ? <div className="mt-px text-[11.5px] text-faint">{item.sub}</div> : null}
          </div>
          {item.hint ? (
            <span className={cn("text-[12px] whitespace-nowrap text-muted-foreground", item.tone === "warn" && "font-medium text-status-warn", item.tone === "bad" && "font-medium text-status-bad")}>
              {item.hint}
            </span>
          ) : (
            <span />
          )}
        </li>
      ))}
    </ul>
  );
}
