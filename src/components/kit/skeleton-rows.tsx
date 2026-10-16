export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 p-4" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-3 rounded bg-muted" style={{ width: `${88 - index * 8}%` }} />
      ))}
    </div>
  );
}
