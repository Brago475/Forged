import {
  HeroCardSkeleton,
  StatRowSkeleton,
  ActionGridSkeleton,
  CardSkeleton,
} from './PageSkeletons'
import { Skeleton } from '../ui/Skeleton'

/**
 * Dashboard-specific skeleton. Mirrors the HomeTab layout so
 * the transition between skeleton and real content feels seamless.
 */
export function DashboardSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 !rounded-full" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-5 w-48 !rounded-lg" />
          <Skeleton className="h-3 w-32 !rounded-lg" />
        </div>
      </div>
      <HeroCardSkeleton />
      <StatRowSkeleton count={3} />
      <ActionGridSkeleton count={4} />
      <CardSkeleton height={40} />
      <CardSkeleton height={28} />
      <CardSkeleton height={28} />
      <CardSkeleton height={44} />
    </div>
  )
}