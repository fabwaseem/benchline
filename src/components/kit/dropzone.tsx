"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function Dropzone({
  accept,
  label,
  onFile,
}: {
  accept: string;
  label: string;
  onFile: (file: File) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground",
        over && "border-primary bg-primary/5 text-foreground",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const file = event.dataTransfer.files[0];
        if (file) onFile(file);
      }}
    >
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
        }}
      />
      {label}
    </label>
  );
}
