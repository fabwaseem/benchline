export function ScoreRing({ score, label = "Score" }: { score: number; label?: string }) {
  const tone = score >= 70 ? "var(--success)" : score >= 40 ? "var(--warning)" : "var(--danger)";
  const turn = Math.max(0, Math.min(100, score)) * 3.6;
  return (
    <div
      className="grid size-[84px] place-items-center rounded-full"
      style={{ background: `conic-gradient(${tone} ${turn}deg, var(--border) 0deg)` }}
      role="img"
      aria-label={`${label} ${score}`}
    >
      <div className="grid size-[68px] place-items-center rounded-full bg-surface font-mono text-[22px] tracking-[-0.04em] tabular-nums">
        {score}
      </div>
    </div>
  );
}
