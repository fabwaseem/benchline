"use client";

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent, type KeyboardEvent } from "react";
import { parseDroppedUrl, validateFiles, type FileRejection, type FileRules } from "@/components/kit/upload/files";

export type UseFileDropOptions = FileRules & {
  multiple?: boolean;
  disabled?: boolean;
  windowDrop?: boolean;
  onFiles?: (files: File[]) => void;
  onFile?: (file: File) => void;
  onUrl?: (url: string) => void;
  onReject?: (errors: FileRejection[]) => void;
};

export function useFileDrop({
  accept,
  maxSize,
  maxFiles,
  multiple = false,
  disabled = false,
  windowDrop = false,
  onFiles,
  onFile,
  onUrl,
  onReject,
}: UseFileDropOptions) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [windowOver, setWindowOver] = useState(false);
  const [errors, setErrors] = useState<FileRejection[]>([]);
  const inputId = useId();
  const depth = useRef(0);

  const take = useCallback((list: File[]) => {
    const result = validateFiles(list, { accept, maxSize, maxFiles: maxFiles ?? (multiple ? undefined : 1) });
    setErrors(result.errors);
    if (result.errors.length > 0) onReject?.(result.errors);
    if (result.accepted.length > 0) {
      onFiles?.(result.accepted);
      const first = result.accepted[0];
      if (first) onFile?.(first);
    }
  }, [accept, maxFiles, maxSize, multiple, onFile, onFiles, onReject]);

  const open = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  useEffect(() => {
    if (!windowDrop) return;
    function enter(event: globalThis.DragEvent) {
      if (!event.dataTransfer?.types.includes("Files")) return;
      event.preventDefault();
      depth.current += 1;
      setWindowOver(true);
    }
    function leave(event: globalThis.DragEvent) {
      event.preventDefault();
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setWindowOver(false);
    }
    function over(event: globalThis.DragEvent) {
      if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
    }
    function drop(event: globalThis.DragEvent) {
      if (!event.dataTransfer?.types.includes("Files")) return;
      event.preventDefault();
      depth.current = 0;
      setWindowOver(false);
      take([...event.dataTransfer.files]);
    }
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", over);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", drop);
    };
  }, [take, windowDrop]);

  function onDragOver(event: DragEvent) {
    event.preventDefault();
    if (!disabled) setDragOver(true);
  }
  function onDragLeave() {
    setDragOver(false);
  }
  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const url = event.dataTransfer.getData("text/uri-list") || event.dataTransfer.getData("text/plain");
    const parsed = url ? parseDroppedUrl(url) : null;
    if (parsed && onUrl && event.dataTransfer.files.length === 0) {
      onUrl(parsed);
      return;
    }
    take([...event.dataTransfer.files]);
  }
  function onPaste(event: ClipboardEvent) {
    if (disabled) return;
    const files = [...event.clipboardData.files];
    if (files.length > 0) {
      event.preventDefault();
      take(files);
      return;
    }
    const parsed = parseDroppedUrl(event.clipboardData.getData("text/plain"));
    if (parsed && onUrl) {
      event.preventDefault();
      onUrl(parsed);
    }
  }
  function onKeyDown(event: KeyboardEvent) {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  }

  return {
    dragOver,
    windowOver,
    errors,
    open,
    inputId,
    inputRef,
    inputProps: {
      id: inputId,
      ref: inputRef,
      type: "file" as const,
      accept,
      multiple,
      disabled,
      className: "sr-only",
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        take(event.target.files ? [...event.target.files] : []);
        event.target.value = "";
      },
    },
    rootProps: {
      onDragOver,
      onDragLeave,
      onDrop,
      onPaste,
      onKeyDown,
      onClick: open,
      role: "button" as const,
      tabIndex: disabled ? -1 : 0,
      "aria-disabled": disabled || undefined,
    },
  };
}
