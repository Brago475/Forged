import type { CSSProperties } from 'react'

/**
 * Theme-safe shimmer block. Uses opacity-based shimmer so it
 * adapts to any theme without hardcoded surface colors.
 *
 * Pass className for layout (width, height, shape overrides).
 * Use !rounded-full or !rounded-lg to override the default radius.
 */
export function Skeleton({
  className = '',
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return <div className={`skel-shimmer ${className}`} style={style} />
}