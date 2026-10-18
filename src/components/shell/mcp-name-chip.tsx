"use client";

import { useState } from "react";
import { Button } from "@/components/kit/primitives/button";

export function McpNameChip({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="chip h-[22px] px-2 font-mono text-[11px]"
      aria-label={copied ? "Copied MCP tool name" : `Copy MCP tool name ${name}`}
      onClick={() => {
        void navigator.clipboard.writeText(name).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        });
      }}
    >
      {copied ? "Copied" : name}
    </Button>
  );
}
