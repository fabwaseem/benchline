"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function FileDropzone(props: {
  accept: string;
  label: string;
  onFile?: (file: File) => void;
  onFiles?: (files: File[]) => void;
  multiple?: boolean;
  invalid?: boolean;
}) {
  return <Dropzone {...props} />;
}

export function Dropzone({
  accept,
  label,
  onFile,
  onFiles,
  multiple = false,
  invalid = false,
}: {
  accept: string;
  label: string;
  onFile?: (file: File) => void;
  onFiles?: (files: File[]) => void;
  multiple?: boolean;
  invalid?: boolean;
}) {
  const [over, setOver] = useState(false);
  function take(list: FileList | readonly File[] | null) {
    const files = list ? [...list] : [];
    if (files.length === 0) return;
    onFiles?.(files);
    const first = files[0];
    if (first) onFile?.(first);
  }
  return (
    <label
      aria-invalid={invalid || undefined}
      className={cn(
        "flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground",
        over && "border-foreground bg-muted text-foreground",
        invalid && "border-destructive",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        take(event.dataTransfer.files);
      }}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          take(event.target.files);
          event.target.value = "";
        }}
      />
      {label}
    </label>
  );
}
