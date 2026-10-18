"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

export function ToolActions({ title }: { slug: string; title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn"
      onClick={() => {
        const url = window.location.href;
        const share = navigator.share?.({ title, url });
        if (share) {
          void share.catch(() => undefined);
          return;
        }
        void navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        });
      }}
    >
      <Share2 size={15} strokeWidth={1.75} />
      {copied ? "Copied" : "Share"}
    </button>
  );
}
