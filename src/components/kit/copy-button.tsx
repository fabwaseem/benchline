"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyButton({
  value,
  label = "Copy",
  disabled,
}: {
  value: string;
  label?: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || !value}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          toast.success("Copied");
          window.setTimeout(() => setCopied(false), 1200);
        });
      }}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}
