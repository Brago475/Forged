import { Skeleton } from '../ui/Skeleton'

/**
 * Dashboard-specific skeleton. Mirrors the HomeTab layout block-by-block
 * so the transition from skeleton to real content feels seamless.
 */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-48 !rounded-lg" />
          <Skeleton className="h-3 w-36 !rounded-md" />
        </div>
      </div>

      {/* Hero calorie card */}
      <Skeleton className="h-[340px]" />

      {/* Macros card */}
      <Skeleton className="h-52" />

      {/* Quick actions */}
      <Skeleton className="h-28" />

      {/* Today's Goals */}
      <Skeleton className="h-48" />

      {/* Workout snapshot */}
      <Skeleton className="h-32" />

      {/* Food snapshot */}
      <Skeleton className="h-32" />

      {/* Progress preview */}
      <Skeleton className="h-56" />

      {/* Insight */}
      <Skeleton className="h-20" />
    </div>
  )
}