import { cn } from "@/lib/utils";

export function Truncate({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn("block min-w-0 truncate whitespace-nowrap", className)} title={value}>
      {value}
    </span>
  );
}
