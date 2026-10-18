"use client";

import { useState } from "react";
import { Button } from "@/components/kit/primitives/button";
import { Dropzone } from "@/components/kit/upload/dropzone";
import { formatBytes } from "@/components/kit/upload/files";
import { useObjectUrl } from "@/components/kit/upload/object-url";

export function ImageUpload({
  file,
  onFile,
  accept = "image/*",
  maxSize,
  aspect,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  accept?: string;
  maxSize?: number;
  aspect?: string;
}) {
  const url = useObjectUrl(file);
  const [size, setSize] = useState<{ file: File | null; width: number; height: number } | null>(null);
  const measured = size?.file === file ? size : null;
  if (!file || !url) {
    return <Dropzone accept={accept} maxSize={maxSize} label="Drop an image or browse" hint={aspect ? `Aspect ${aspect}` : ".png, .jpg, .webp"} onFile={(next) => onFile(next)} />;
  }
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-surface p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="size-20 rounded-sm object-cover"
        style={aspect ? { aspectRatio: aspect } : undefined}
        onLoad={(event) => setSize({ file, width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{file.name}</p>
        <p className="font-mono text-[12px] text-muted-foreground">
          {measured ? `${measured.width}×${measured.height}` : "Reading size"} · {formatBytes(file.size)}
        </p>
        <div className="mt-2 flex gap-2">
          <label className="btn h-control-sm cursor-pointer px-2 text-[12px]">
            Replace
            <input
              type="file"
              accept={accept}
              className="sr-only"
              onChange={(event) => {
                const next = event.target.files?.[0];
                if (next) onFile(next);
                event.target.value = "";
              }}
            />
          </label>
          <Button variant="ghost" size="sm" onClick={() => onFile(null)}>Remove</Button>
        </div>
      </div>
    </div>
  );
}
