import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

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
    <div className={cn("flex min-w-0 flex-col gap-4 p-4", className)}>
      {title ? <p className="text-xs font-medium tracking-tight text-muted-foreground">{title}</p> : null}
      {children}
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
  flow = "rail",
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
    return (
      <section className="flex min-w-0 flex-col bg-surface">
        <div className="flex h-12 items-center gap-3 border-b border-border bg-gradient-to-b from-surface to-well px-3.5 min-[700px]:px-5 dark:from-raised dark:to-surface">
          {tabs}
          <div className="ml-auto flex items-center gap-2">
            {actions}
          </div>
        </div>
        {busy ? <div aria-hidden className="h-px w-full bg-foreground/40" /> : null}
        <div
          className={cn(
            "grid",
            layout === "split" && "min-[700px]:grid-cols-2",
            layout === "split+inspector" && flow === "rail" && "min-[700px]:grid-cols-2 min-[1280px]:min-h-[620px] min-[1280px]:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_340px]",
            layout === "split+inspector" && flow === "band" && "min-[700px]:grid-cols-2 min-[1280px]:min-h-[620px]",
            layout === "split+inspector" && flow === "band" && (columns ?? "min-[1280px]:grid-cols-[360px_minmax(0,1fr)_320px]"),
          )}
        >
          {layout === "single" ? <div className="min-w-0">{children ?? input}</div> : null}
          {layout === "split" ? (
            <>
              <div className="flex min-w-0 flex-col border-b border-border min-[700px]:border-r min-[700px]:border-b-0">{input}</div>
              <div className="flex min-w-0 flex-col">{output}</div>
            </>
          ) : null}
          {layout === "split+inspector" && flow === "rail" ? (
            <>
              <div className="flex min-w-0 flex-col border-b border-border min-[700px]:col-start-1 min-[700px]:border-r min-[1280px]:col-start-1 min-[1280px]:border-b-0">{input}</div>
              <div className="flex min-w-0 flex-col border-b border-border min-[700px]:col-start-2 min-[700px]:row-span-2 min-[700px]:border-b-0 min-[1280px]:col-start-2 min-[1280px]:row-span-1 min-[1280px]:border-r">{output}</div>
              <div className="flex min-w-0 flex-col min-[700px]:col-start-1 min-[700px]:border-r min-[700px]:border-border min-[1280px]:col-start-3 min-[1280px]:border-r-0">{inspector}</div>
            </>
          ) : null}
          {layout === "split+inspector" && flow === "band" ? (
            <>
              <div className="flex min-w-0 flex-col border-b border-border min-[700px]:border-r min-[700px]:border-b-0">{input}</div>
              <div className="flex min-w-0 flex-col border-b border-border min-[1280px]:border-r min-[1280px]:border-b-0">{output}</div>
              <div className="flex min-w-0 flex-col min-[700px]:col-span-2 min-[1280px]:col-span-1">{inspector}</div>
            </>
          ) : null}
        </div>
        {status ? <div className="flex items-center gap-2 border-t border-border px-4 py-2.5 font-mono text-[12px] text-muted-foreground">{status}</div> : null}
      </section>
    );
  }
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
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
