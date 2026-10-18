import { createElement } from "react";
import { iconFor } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function Cover({
  hue,
  icon,
  size = 40,
  className,
}: {
  hue: number;
  icon: string;
  size?: number;
  className?: string;
}) {
  const radius = size >= 48 ? "var(--radius-xl)" : "var(--radius-sm)";
  return (
    <span
      className={cn("cover", className)}
      style={{ width: size, height: size, borderRadius: radius, ["--h" as string]: String(hue) }}
    >
      {createElement(iconFor(icon), { size: Math.round(size * 0.46), strokeWidth: 1.75, "aria-hidden": true })}
    </span>
  );
}
