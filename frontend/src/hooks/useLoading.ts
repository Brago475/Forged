import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode, createElement } from 'react'

interface LoadingContextValue {
  isLoading: boolean
  pushLoading: () => void
  popLoading: () => void
}

const LoadingContext = createContext<LoadingContextValue | null>(null)

/**
 * Provides a single app-wide loading state. Pages use useLoadingEffect
 * to declaratively mark themselves as loading while an async task runs.
 * The Dashboard reads isLoading to render a single overlay loader.
 *
 * Uses a counter so concurrent async operations all get tracked; the
 * overlay hides only when every loading task has completed.
 *
 * A minimum display time (500ms) prevents the loader from flashing
 * when a fetch resolves very quickly (e.g. from cache).
 */
export function LoadingProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState<number>(0)
  const [stableIsLoading, setStableIsLoading] = useState<boolean>(false)
  const startedAt = useRef<number | null>(null)

  const rawIsLoading = count > 0

  useEffect(() => {
    const MIN_MS = 500

    if (rawIsLoading) {
      if (startedAt.current == null) startedAt.current = Date.now()
      setStableIsLoading(true)
      return
    }

    const elapsed = startedAt.current != null ? Date.now() - startedAt.current : 0
    const remaining = Math.max(MIN_MS - elapsed, 0)
    const timer = setTimeout(() => {
      setStableIsLoading(false)
      startedAt.current = null
    }, remaining)
    return () => clearTimeout(timer)
  }, [rawIsLoading])

  const pushLoading = useCallback(() => setCount(c => c + 1), [])
  const popLoading = useCallback(() => setCount(c => Math.max(c - 1, 0)), [])

  return createElement(
    LoadingContext.Provider,
    { value: { isLoading: stableIsLoading, pushLoading, popLoading } },
    children
  )
}

/**
 * Reads the current app loading state. Use in the Dashboard shell
 * to decide whether to show the loader overlay.
 */
export function useLoadingState(): boolean {
  const ctx = useContext(LoadingContext)
  if (!ctx) return false
  return ctx.isLoading
}

/**
 * Declarative async loading wrapper. Pass an async function and
 * deps array; the hook tracks loading state automatically.
 *
 * Usage:
 *   useLoadingEffect(async () => {
 *     const data = await api.workout.getLogs(30)
 *     setLogs(data)
 *   }, [])
 */
export function useLoadingEffect(
  effect: () => Promise<void>,
  deps: React.DependencyList
) {
  const ctx = useContext(LoadingContext)

  useEffect(() => {
    if (!ctx) {
      effect().catch(console.error)
      return
    }

    let cancelled = false
    ctx.pushLoading()
    effect()
      .catch(err => {
        if (!cancelled) console.error(err)
      })
      .finally(() => {
        if (!cancelled) ctx.popLoading()
      })

    return () => {
      cancelled = true
      ctx.popLoading()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}