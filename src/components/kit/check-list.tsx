import { CheckRows, type CheckLevel } from "@/components/kit/check-row";

export type { CheckLevel };

export function CheckList({
  rows,
}: {
  rows: { level: CheckLevel; label: string; detail: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <CheckRows rows={rows} />
    </div>
  );
}
