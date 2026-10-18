import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PaneRatio = "50/50" | "40/60" | "35/65" | "60/40";

const columns: Record<PaneRatio, string> = {
  "50/50": "minmax(0,1fr) minmax(0,1fr)",
  "40/60": "minmax(0,2fr) minmax(0,3fr)",
  "35/65": "minmax(0,7fr) minmax(0,13fr)",
  "60/40": "minmax(0,3fr) minmax(0,2fr)",
};

/** Two panes side by side. They stack in one column under 900px. */
export function ToolPanes({
  ratio = "50/50",
  children,
  className,
}: {
  ratio?: PaneRatio;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 min-[900px]:min-h-[480px] min-[900px]:[grid-template-columns:var(--tool-cols)]",
        "[&>*]:min-h-0 [&>*]:min-w-0 [&>*]:border-b [&>*]:border-border [&>*:last-child]:border-b-0",
        "min-[900px]:[&>*]:border-r min-[900px]:[&>*]:border-b-0 min-[900px]:[&>*:last-child]:border-r-0",
        className,
      )}
      style={{ "--tool-cols": columns[ratio] } as CSSProperties}
    >
      {children}
    </div>
  );
}
