import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { StatusBar } from "@/components/kit/status-bar";
import { ToolCard } from "@/components/kit/shell/tool-card";
import { ToolPanes, type PaneRatio } from "@/components/kit/shell/tool-panes";
import { cn } from "@/lib/utils";

function ratioFrom(columns: string | undefined, layout: string | undefined): PaneRatio {
  if (!columns || layout !== "split+inspector") return "50/50";
  if (columns.includes("1.1fr") || columns.includes("0.9fr")) return "60/40";
  return "50/50";
}

export function Panel({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      {title ? (
        <p className="border-b border-border px-3 py-2 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">{title}</p>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3">{children}</div>
    </div>
  );
}

export function ToolTabs<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex h-12 items-center gap-5"
      onKeyDown={(event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        const index = options.findIndex((option) => option.value === value);
        const next = event.key === "ArrowRight" ? (index + 1) % options.length : (index - 1 + options.length) % options.length;
        const option = options[next];
        if (!option) return;
        onChange(option.value);
        const tabs = event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]');
        tabs[next]?.focus();
      }}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            id={`tab-${option.value}`}
            aria-selected={selected}
            aria-controls={`panel-${option.value}`}
            tabIndex={selected ? 0 : -1}
            data-on={selected ? "true" : "false"}
            className="utab bg-transparent"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function useWorkbenchKeys(map: { onEnter?: () => void; onCopy?: () => void; onEscape?: () => void }) {
  const { onEnter, onCopy, onEscape } = map;
  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key === "Enter") {
        event.preventDefault();
        onEnter?.();
      } else if (meta && event.shiftKey && event.key.toLowerCase() === "c") {
        event.preventDefault();
        onCopy?.();
      } else if (event.key === "Escape" && onEscape) {
        event.preventDefault();
        onEscape();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onEnter, onCopy, onEscape]);
}

export function InkButton({
  children,
  icon,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode }) {
  const label = typeof children === "string" ? children : props["aria-label"];
  return (
    <>
      <button type="button" {...props} className={cn("btn btn-ink hidden h-[30px] min-[700px]:inline-flex", className)}>
        {children}
      </button>
      <button type="button" {...props} aria-label={label} className="btn btn-ink inline-flex size-11 p-0 min-[700px]:hidden">
        {icon ?? children}
      </button>
    </>
  );
}

export function ToolShell({
  actions,
  input,
  output,
  inspector,
  children,
  tabs,
  status,
  layout,
  columns,
  busy = false,
}: {
  runsLocally: boolean;
  actions?: ReactNode;
  input?: ReactNode;
  output?: ReactNode;
  inspector?: ReactNode;
  children?: ReactNode;
  tabs?: ReactNode;
  status?: ReactNode;
  layout?: "single" | "split" | "split+inspector";
  flow?: "rail" | "band";
  columns?: string;
  busy?: boolean;
}) {
  if (layout) {
    const ratio = ratioFrom(columns, layout);
    return (
      <ToolCard>
        <div className="flex min-h-12 flex-col gap-2 border-b border-border px-3 py-2 min-[700px]:flex-row min-[700px]:items-center min-[700px]:px-4">
          <div className="min-w-0 flex-1 overflow-hidden">{tabs}</div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        </div>
        {busy ? <div aria-hidden className="h-px w-full bg-foreground/40" /> : null}
        {layout === "single" ? <div className="min-w-0">{children ?? input}</div> : (
          <ToolPanes ratio={layout === "split+inspector" ? ratio : "50/50"}>
            <div className="flex min-w-0 flex-col">{input}</div>
            <div className="flex min-w-0 flex-col">{output}</div>
          </ToolPanes>
        )}
        {inspector ? <div className="border-t border-border">{inspector}</div> : null}
        {status ? <StatusBar>{status}</StatusBar> : null}
      </ToolCard>
    );
  }
  return (
    <section className="flex min-w-0 flex-col bg-surface">
      {actions ? (
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>
        </div>
      ) : null}
      {children ?? (
        <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-border">
          <Panel title="Input">{input}</Panel>
          <div className="border-t border-border lg:border-t-0">
            <Panel title="Output">{output}</Panel>
          </div>
        </div>
      )}
    </section>
  );
}
