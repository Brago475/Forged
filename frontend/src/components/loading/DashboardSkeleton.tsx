import { PageLoader } from './PageLoader'

/**
 * Dashboard loading state. Delegates to the unified PageLoader
 * so Dashboard.tsx's existing import keeps working without changes.
 */
export function DashboardSkeleton() {
  return <PageLoader />
}