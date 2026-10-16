import { createElement } from "react";
import { iconFor } from "@/lib/icons";

export function ToolIcon({
  name,
  className,
  size = 16,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  return createElement(iconFor(name), { className, size, strokeWidth: 1.75, "aria-hidden": true });
}
