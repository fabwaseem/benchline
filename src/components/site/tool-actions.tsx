"use client";

import { useState } from "react";
import { Check, Share as Share2 } from "kineticons";
import { Button } from "@/components/kit/primitives/button";
import { cn } from "@/lib/utils";

export function ToolActions({ title, className }: { slug: string; title: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className={cn("sm:h-control-md sm:px-3.5 sm:text-[13.5px]", className)}
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
      {copied ? <Check size={15} aria-hidden /> : <Share2 size={15} aria-hidden />}
      {copied ? "Link copied" : "Share"}
    </Button>
  );
}
