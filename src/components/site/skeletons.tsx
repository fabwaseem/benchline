import { Skeleton } from "@/components/kit/primitives/skeleton";

/** Loading shapes that match the real layouts, so nothing jumps when content arrives. */

export function ToolCardSkeleton() {
  return (
    <div className="flex h-full min-h-[172px] flex-col gap-4 rounded-xl border border-border bg-surface p-4">
      <Skeleton className="size-10 rounded-sm" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="mt-auto flex gap-1.5">
        <Skeleton className="h-[22px] w-16 rounded-sm" />
        <Skeleton className="h-[22px] w-10 rounded-sm" />
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <aside aria-hidden className="hidden w-64 shrink-0 border-r border-border py-6 pr-4 lg:block">
      <Skeleton className="mx-2.5 mb-4 h-3 w-24" />
      <div className="space-y-1.5">
        {Array.from({ length: 11 }, (_, index) => (
          <div key={index} className="flex h-9 items-center gap-2.5 px-2.5">
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-5" />
          </div>
        ))}
      </div>
    </aside>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Skeleton className="h-11 w-full max-w-xs sm:h-control-sm" />
      <Skeleton className="h-11 w-24 sm:h-control-sm" />
      <Skeleton className="h-11 w-24 sm:h-control-sm" />
      <Skeleton className="h-11 w-16 sm:h-control-sm" />
      <Skeleton className="ml-auto h-11 w-28 sm:h-control-sm" />
    </div>
  );
}

export function DirectorySkeleton({ cards = 9, header = true }: { cards?: number; header?: boolean }) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading tools" className="page-x frame flex min-h-[calc(100vh-3.75rem)]">
      <SidebarSkeleton />
      <div className="min-w-0 flex-1 pt-8 pb-16 lg:pl-8">
        {header ? (
          <div className="mb-7 space-y-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
        ) : null}
        <FilterBarSkeleton />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: cards }, (_, index) => (
            <ToolCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ToolPageSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading tool" className="page-x frame py-6 lg:py-8">
      <Skeleton className="h-3 w-56" />
      <div className="mt-5 flex items-start gap-4">
        <Skeleton className="size-14 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <div className="flex gap-1.5">
            <Skeleton className="h-[22px] w-32 rounded-sm" />
            <Skeleton className="h-[22px] w-24 rounded-sm" />
          </div>
        </div>
      </div>
      <div className="mt-8 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex h-12 items-center gap-2 border-b border-border px-3">
          <Skeleton className="h-control-sm w-20" />
          <Skeleton className="h-control-sm w-20" />
          <Skeleton className="ml-auto h-control-sm w-24" />
        </div>
        <div className="grid min-h-80 lg:grid-cols-2">
          <div className="space-y-2.5 border-b border-border p-4 lg:border-r lg:border-b-0">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <div className="space-y-2.5 p-4">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContentPageSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading page">
      <div className="border-b border-border">
        <div className="page-x frame space-y-5 py-16 md:py-24">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-full max-w-xl" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="h-4 w-2/3 max-w-md" />
        </div>
      </div>
      <div className="page-x frame mt-16 grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-56 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
