import type { ReactNode } from 'react'

/**
 * Cross-fades between a skeleton and real content. When loading
 * flips false, the skeleton fades out and the content fades in
 * with a staggered entrance.
 *
 * Usage:
 *   <FadeSwap loading={loading} skeleton={<DashboardSkeleton />}>
 *     <YourRealContent />
 *   </FadeSwap>
 */
export function FadeSwap({
  loading,
  skeleton,
  children,
}: {
  loading: boolean
  skeleton: ReactNode
  children: ReactNode
}) {
  if (loading) {
    return <div className="content-fade-in">{skeleton}</div>
  }
  return <div className="content-fade-in">{children}</div>
}