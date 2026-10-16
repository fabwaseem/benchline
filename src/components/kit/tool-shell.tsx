import { cn } from "@/lib/utils";

export function PrivacyBadge({ local }: { local: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-background px-2 py-0.5 text-[11px] tracking-tight text-muted-foreground">
      {local ? "Runs locally" : "Fetches the public URL"}
    </span>
  );
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
    <div className={cn("flex min-w-0 flex-col gap-4 p-4", className)}>
      {title ? <p className="text-xs font-medium tracking-tight text-muted-foreground">{title}</p> : null}
      {children}
    </div>
  );
}

export function ToolShell({
  runsLocally,
  actions,
  input,
  output,
  children,
}: {
  runsLocally: boolean;
  actions?: React.ReactNode;
  input?: React.ReactNode;
  output?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <PrivacyBadge local={runsLocally} />
        {actions ? <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
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
