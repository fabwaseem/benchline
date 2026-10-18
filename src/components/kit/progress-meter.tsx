import { Progress } from "@/components/kit/primitives/progress";

export function ProgressMeter({ label, value }: { label: string; value: number }) {
  const percent = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return <Progress label={label} value={percent} />;
}
