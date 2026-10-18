import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type FieldProps = { "aria-describedby"?: string };

export function FieldRow({
  label,
  htmlFor,
  help,
  error,
  children,
  className,
  variant = "plain",
  actions,
}: {
  label: string;
  htmlFor?: string;
  help?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  variant?: "plain" | "well";
  actions?: ReactNode;
}) {
  const helpId = useId();
  const errorId = useId();
  const describedBy = [error ? errorId : null, help ? helpId : null].filter(Boolean).join(" ") || undefined;
  const field = describedBy && isValidElement<FieldProps>(children)
    ? cloneElement(children as ReactElement<FieldProps>, {
        "aria-describedby": [children.props["aria-describedby"], describedBy].filter(Boolean).join(" "),
      })
    : children;
  return (
    <div className={cn("flex flex-col", variant === "well" && "field-well", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="min-w-0 truncate text-[12.5px] font-medium whitespace-nowrap text-fg2" title={label}>
          {label}
        </label>
        {actions}
      </div>
      {field}
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-status-bad">
          {error}
        </p>
      ) : null}
      {help ? (
        <p id={helpId} className="mt-1.5 text-[12px] text-faint">
          {help}
        </p>
      ) : null}
    </div>
  );
}

export function Field(props: Parameters<typeof FieldRow>[0]) {
  return <FieldRow {...props} />;
}
