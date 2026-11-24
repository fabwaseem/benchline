"use client";

import { useState } from "react";
import { Check, Copy, Plug } from "kineticons";
import { Button } from "@/components/kit/primitives/button";

/** The tool's MCP name as a meta chip; a click copies it. Same height and shape as the other header chips. */
export function McpNameChip({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      className="group h-8 gap-1.5 rounded-md border border-border bg-surface px-2.5 font-mono text-[12px] font-medium text-fg2 shadow-none hover:border-border-strong hover:bg-surface hover:text-foreground"
      aria-label={copied ? "Copied MCP tool name" : `Copy MCP tool name ${name}`}
      title="Copy the MCP tool name"
      onClick={() => {
        void navigator.clipboard.writeText(name).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        });
      }}
    >
      <Plug size={13} aria-hidden className="text-brand-text" />
      {copied ? "Copied" : name}
      {copied ? <Check size={13} aria-hidden className="text-brand-text" /> : <Copy size={13} aria-hidden className="text-faint transition-colors group-hover:text-foreground" />}
    </Button>
  );
}
