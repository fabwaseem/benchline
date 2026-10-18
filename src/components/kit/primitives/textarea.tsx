"use client";

import { forwardRef, useCallback, useLayoutEffect, useRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { fieldClass } from "@/components/kit/primitives/input";

const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea"> & { autosize?: boolean; showCount?: boolean }>(function Textarea(
  { className, autosize = false, showCount = false, value, maxLength, onChange, ...props },
  forwarded,
) {
  const inner = useRef<HTMLTextAreaElement>(null);
  const setRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      inner.current = node;
      if (typeof forwarded === "function") forwarded(node);
      else if (forwarded) forwarded.current = node;
    },
    [forwarded],
  );
  useLayoutEffect(() => {
    const node = inner.current;
    if (!autosize || !node) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, [autosize, value]);
  const length = typeof value === "string" ? value.length : 0;
  return (
    <div className="flex flex-col gap-1">
      <textarea
        ref={setRef}
        data-slot="textarea"
        value={value}
        maxLength={maxLength}
        onChange={onChange}
        className={cn(fieldClass, "h-auto min-h-24 py-2 leading-6", autosize && "resize-none overflow-hidden", className)}
        {...props}
      />
      {showCount ? (
        <p className="text-right font-mono text-[11px] text-faint tabular-nums">
          {length}
          {maxLength ? ` / ${maxLength}` : ""}
        </p>
      ) : null}
    </div>
  );
});

export { Textarea };
