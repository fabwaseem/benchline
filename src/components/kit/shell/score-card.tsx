import type { ReactNode } from "react";
import { ScoreRing } from "@/components/kit/score-ring";
import { Truncate } from "@/components/kit/shell/truncate";

export function ScoreCard({
  score,
  verdict,
  caption,
  stats,
  children,
}: {
  score?: number;
  verdict: string;
  caption?: string;
  stats?: { label: string; value: string }[];
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {typeof score === "number" ? <ScoreRing score={score} /> : null}
        <div className="min-w-0">
          <p className="text-[18px] font-medium tracking-[-0.03em]">{verdict}</p>
          {caption ? <p className="mt-1 text-[12.5px] leading-5 text-muted-foreground">{caption}</p> : null}
        </div>
      </div>
      {stats && stats.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0 rounded-xl bg-well px-3 py-2.5">
              <Truncate value={stat.value} className="font-mono text-[18px] tracking-[-0.04em]" />
              <Truncate value={stat.label} className="text-[12px] text-muted-foreground" />
            </div>
          ))}
        </div>
      ) : null}
      {children}
    </div>
  );
}
