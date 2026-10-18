import type { ReactNode } from "react";

export function EmptyState({
  title,
  hint,
  art,
  action,
}: {
  title: string;
  hint: string;
  art?: ReactNode;
  action?: ReactNode;
}) {
  if (art || action) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        {art ? (
          <div className="mb-4 grid size-16 place-items-center rounded-xl bg-gradient-to-b from-surface to-well text-faint shadow-[var(--in-hi),inset_0_0_0_1px_var(--border),var(--shadow-1)]">
            {art}
          </div>
        ) : null}
        <p className="text-sm font-medium tracking-tight">{title}</p>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{hint}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    );
  }
  return (
    <div className="flex min-h-40 flex-col justify-center rounded-lg border border-dashed border-border px-4 py-8">
      <p className="text-sm font-medium tracking-tight">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}
