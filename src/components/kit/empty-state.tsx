export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex min-h-40 flex-col justify-center rounded-lg border border-dashed border-border px-4 py-8">
      <p className="text-sm font-medium tracking-tight">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}
