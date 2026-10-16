import { cn } from "@/lib/utils";

export function FieldRow({
  label,
  htmlFor,
  help,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  help?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <label htmlFor={htmlFor} className="mb-1.5 text-xs font-medium tracking-tight">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-destructive">{error}</p>
      ) : help ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{help}</p>
      ) : null}
    </div>
  );
}
