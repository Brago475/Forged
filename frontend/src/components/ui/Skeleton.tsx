interface SkeletonProps {
  /** Extra Tailwind classes. Use `h-*`, `w-*`, and `!rounded-*` here. */
  className?: string
}

/**
 * Shimmer skeleton block. Animates a gradient from left to right
 * to indicate a loading placeholder. Sized and shaped via className.
 *
 * @example
 *   <Skeleton className="h-5 w-48" />
 *   <Skeleton className="h-64 !rounded-2xl" />
 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{
        background:
          'linear-gradient(90deg, var(--surface2) 25%, var(--surface2-highlight, rgba(255,255,255,0.04)) 50%, var(--surface2) 75%)',
        backgroundSize: '200% 100%',
        animation: 'forgedSkelShimmer 1.5s ease infinite',
      }}
    />
  )
}