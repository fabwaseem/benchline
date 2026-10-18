"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/kit/primitives/button";

const sizes = {
  sm: "icon-sm",
  md: "icon",
  lg: "icon-lg",
} as const;

export function IconButton({
  label,
  size = "md",
  variant = "ghost",
  ...props
}: Omit<ComponentProps<typeof Button>, "size" | "variant" | "aria-label"> & {
  label: string;
  size?: keyof typeof sizes;
  variant?: ComponentProps<typeof Button>["variant"];
}) {
  return <Button aria-label={label} size={sizes[size]} variant={variant} {...props} />;
}
