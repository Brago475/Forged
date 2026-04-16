import { useEffect, useRef, useState } from 'react'

/**
 * Animates a number from its current value to `target`
 * over `durationMs`, using ease-out-cubic.
 *
 * Useful for counting-up stats (e.g. calories consumed).
 *
 * @example
 *   const animCalories = useAnimatedNumber(1200)
 */
export function useAnimatedNumber(target: number, durationMs = 800): number {
  const [value, setValue] = useState<number>(0)
  const rafIdRef = useRef<number>(0)

  useEffect(() => {
    const startTime = performance.now()

    const tick = (now: number): void => {
      const progress = Math.min((now - startTime) / durationMs, 1)
      // Ease-out-cubic: fast start, soft landing.
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(tick)
      }
    }

    rafIdRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafIdRef.current)
  }, [target, durationMs])

  return value
}