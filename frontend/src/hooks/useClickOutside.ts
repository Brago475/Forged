import { useEffect, type RefObject } from 'react'

/**
 * Calls `handler` when the user clicks outside the element
 * referenced by `ref`. Used for closing dropdowns and popovers.
 *
 * @example
 *   const ref = useRef<HTMLDivElement>(null)
 *   useClickOutside(ref, () => setOpen(false))
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: () => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent): void => {
      if (!ref.current || ref.current.contains(event.target as Node)) return
      handler()
    }

    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}