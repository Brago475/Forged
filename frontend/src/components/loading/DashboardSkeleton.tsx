import { Skeleton } from '../ui/Skeleton'

/**
 * Skeleton layout shown during page transitions and between the
 * brand loader and the real dashboard content. Mirrors the rough
 * shape of HomeTab so the transition feels seamless.
 */
export function DashboardSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 !rounded-full" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* Hero card */}
      <Skeleton className="h-64 !rounded-2xl" />

      {/* Macros */}
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-28 !rounded-2xl" />
        <Skeleton className="h-28 !rounded-2xl" />
        <Skeleton className="h-28 !rounded-2xl" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3">
        <Skeleton className="h-20 !rounded-2xl" />
        <Skeleton className="h-20 !rounded-2xl" />
        <Skeleton className="h-20 !rounded-2xl" />
        <Skeleton className="h-20 !rounded-2xl" />
      </div>

      {/* Goals / workout / food / progress */}
      <Skeleton className="h-40 !rounded-2xl" />
      <Skeleton className="h-28 !rounded-2xl" />
      <Skeleton className="h-28 !rounded-2xl" />
      <Skeleton className="h-44 !rounded-2xl" />
    </div>
  )
}