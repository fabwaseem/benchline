"use client";

import { useState } from "react";

export function McpNameChip({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="chip cursor-pointer transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      aria-label={copied ? "Copied MCP tool name" : `Copy MCP tool name ${name}`}
      onClick={() => {
        void navigator.clipboard.writeText(name).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        });
      }}
    >
      {copied ? "Copied" : name}
    </button>
  );
}
