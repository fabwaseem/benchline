"use client";

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/kit/primitives/button";
import { visibleTabIndexes } from "@/components/kit/shell/fit-tabs";
import { cn } from "@/lib/utils";

const GAP = 20;

export function ToolToolbar<T extends string>({
  label = "Mode",
  options,
  value,
  onChange,
  leading,
  actions,
  className,
}: {
  label?: string;
  options?: { value: T; label: string }[];
  value?: T;
  onChange?: (value: T) => void;
  leading?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const tabs = useMemo(() => options ?? [], [options]);
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLSpanElement>(null);
  const [indexes, setIndexes] = useState<number[]>(() => tabs.map((_, index) => index));

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure || tabs.length === 0) return;
    const fit = () => {
      const buttons = [...measure.querySelectorAll<HTMLElement>("[data-tab]")];
      const widths = buttons.map((button) => button.offsetWidth);
      const moreWidth = moreRef.current?.offsetWidth ?? 72;
      const selected = Math.max(0, tabs.findIndex((option) => option.value === value));
      setIndexes(visibleTabIndexes(widths, row.clientWidth, moreWidth, GAP, selected));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(row);
    return () => observer.disconnect();
  }, [tabs, value]);

  const visible = new Set(indexes);
  const hidden = tabs.filter((_, index) => !visible.has(index));
  const overflowSelected = hidden.find((option) => option.value === value);

  return (
    <div className={cn("flex min-h-12 flex-col gap-2 border-b border-border px-3 py-2 min-[700px]:flex-row min-[700px]:items-center min-[700px]:px-3", className)}>
      <div className="flex min-w-0 flex-1 items-center">
        {leading}
        {tabs.length > 0 ? (
          <div className="relative min-w-0 flex-1">
            <div ref={measureRef} aria-hidden className="pointer-events-none invisible absolute top-0 left-0 flex w-max gap-5">
              {tabs.map((option) => (
                <span key={option.value} data-tab className="utab shrink-0 whitespace-nowrap">
                  {option.label}
                </span>
              ))}
              <span ref={moreRef} className="utab inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
                More
                <ChevronDown size={14} />
              </span>
            </div>
            <div
              ref={rowRef}
              role="tablist"
              aria-label={label}
              className="flex h-control-lg items-center gap-5 overflow-hidden"
              onKeyDown={(event) => {
                if (!onChange || (event.key !== "ArrowRight" && event.key !== "ArrowLeft")) return;
                event.preventDefault();
                const order = tabs.filter((_, index) => visible.has(index));
                const current = order.findIndex((option) => option.value === value);
                const next = event.key === "ArrowRight" ? (current + 1) % order.length : (current - 1 + order.length) % order.length;
                const option = order[next];
                if (!option) return;
                onChange(option.value);
              }}
            >
              {tabs.map((option, index) => {
                if (!visible.has(index)) return null;
                const selected = value === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="ghost"
                    size="sm"
                    role="tab"
                    aria-selected={selected}
                    tabIndex={selected ? 0 : -1}
                    data-on={selected ? "true" : "false"}
                    className="utab h-control-lg shrink-0 bg-transparent px-0 whitespace-nowrap"
                    onClick={() => onChange?.(option.value)}
                  >
                    {option.label}
                  </Button>
                );
              })}
              {hidden.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    type="button"
                    className={cn("utab inline-flex shrink-0 items-center gap-1 bg-transparent whitespace-nowrap", overflowSelected && "text-foreground")}
                    data-on={overflowSelected ? "true" : "false"}
                  >
                    {overflowSelected ? overflowSelected.label : "More"}
                    <ChevronDown size={14} aria-hidden />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-40">
                    <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange?.(next as T)}>
                      {hidden.map((option) => (
                        <DropdownMenuRadioItem key={option.value} value={option.value}>
                          {option.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
