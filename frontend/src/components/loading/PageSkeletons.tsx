import { Skeleton } from '../ui/Skeleton'

/**
 * Reusable page skeleton shapes. Each page imports the ones
 * that match its content layout. All shapes use the theme-safe
 * <Skeleton /> primitive so they work on any theme.
 *
 * Usage:
 *   import { PageHeaderSkeleton, CardSkeleton } from '../components/loading/PageSkeletons'
 *   if (loading) return (
 *     <div className="flex flex-col gap-4">
 *       <PageHeaderSkeleton />
 *       <CardSkeleton height={32} />
 *     </div>
 *   )
 */

export function PageHeaderSkeleton({ withSubtitle = false }: { withSubtitle?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-7 w-32 !rounded-xl" />
      {withSubtitle && <Skeleton className="h-4 w-48 !rounded-lg" />}
    </div>
  )
}

export function CardSkeleton({ height = 32 }: { height?: number }) {
  return <Skeleton style={{ height: `${height * 4}px` }} />
}

export function HeroCardSkeleton() {
  return <Skeleton className="h-64" />
}

export function StatRowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28" />
      ))}
    </div>
  )
}

export function ActionGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
  )
}

export function ListSkeleton({ rows = 3, rowHeight = 32 }: { rows?: number; rowHeight?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} style={{ height: `${rowHeight * 4}px` }} />
      ))}
    </div>
  )
}

export function AvatarRowSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 !rounded-full" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-4 w-1/2 !rounded-lg" />
            <Skeleton className="h-3 w-1/3 !rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function GenericPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeaderSkeleton withSubtitle />
      <HeroCardSkeleton />
      <StatRowSkeleton count={3} />
      <ListSkeleton rows={2} rowHeight={28} />
    </div>
  )
}