"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function downloadText(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  toast.success("Downloaded");
}

export function downloadBytes(filename: string, bytes: Uint8Array, mime = "application/octet-stream") {
  const copy = new Uint8Array(bytes);
  const blob = new Blob([copy], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  toast.success("Downloaded");
}

export function DownloadButton({
  filename,
  content,
  mime,
  label = "Download",
  disabled,
}: {
  filename: string;
  content: string;
  mime?: string;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || !content}
      onClick={() => downloadText(filename, content, mime)}
    >
      {label}
    </Button>
  );
}
