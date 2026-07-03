export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-200/70 ${className}`} aria-hidden="true">
      {/* soft red shimmer sweep (concept: 34-Splash-Loading) */}
      <span className="fx-shimmer absolute inset-0 opacity-60" />
    </div>
  )
}

export function MetricSkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-4 h-8 w-20" />
          <Skeleton className="mt-3 h-3 w-32" />
        </div>
      ))}
    </div>
  )
}

