"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { ActionButton } from "@/components/kit/controls";

export function CopyButton({
  value,
  label = "Copy",
  toastMessage = "Copied",
  disabled,
  variant = "outline",
  size = "sm",
  className,
  icon,
  iconOnly = false,
}: {
  value: string;
  label?: string;
  toastMessage?: string;
  disabled?: boolean;
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "icon" | "default";
  className?: string;
  icon?: ReactNode;
  iconOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <ActionButton
      variant={variant}
      size={iconOnly ? "icon" : size}
      className={className}
      disabled={disabled || !value}
      aria-label={label}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          toast.success(toastMessage);
          window.setTimeout(() => setCopied(false), 1200);
        });
      }}
    >
      {icon}
      {iconOnly ? null : copied ? "Copied" : label}
    </ActionButton>
  );
}
