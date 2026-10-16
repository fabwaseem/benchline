"use client";

import { useState } from "react";
import { Share2, Star } from "lucide-react";

export function ToolActions({ slug, title }: { slug: string; title: string }) {
  const [starred, setStarred] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
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
      <button
        type="button"
        className="btn"
        aria-pressed={starred}
        onClick={() => {
          const key = "benchline:stars";
          const current = new Set(JSON.parse(localStorage.getItem(key) ?? "[]") as string[]);
          if (current.has(slug)) current.delete(slug);
          else current.add(slug);
          localStorage.setItem(key, JSON.stringify([...current]));
          setStarred(current.has(slug));
        }}
      >
        <Star size={15} strokeWidth={1.75} fill={starred ? "currentColor" : "none"} />
        Star
      </button>
    </div>
  );
}
