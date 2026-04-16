import { useEffect, useState, type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  /** Milliseconds to wait before the stagger-in animation fires. */
  delay?: number
  /** If true, applies the hero purple glow (used for the main calorie card). */
  hero?: boolean
}

/**
 * FORGE UI card with stagger reveal: translateY(16px) to 0
 * over 350ms cubic-bezier. Designed to be stacked with increasing
 * delays so a list of cards reveals sequentially.
 */
export function Card({ children, className = '', delay = 0, hero = false }: CardProps) {
  const [visible, setVisible] = useState<boolean>(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const heroShadow = hero ? 'shadow-lg shadow-forged-purple/5' : ''

  return (
    <div
      className={`bg-forged-surface border border-forged-border rounded-2xl p-5
        hover:border-forged-purple/20
        ${heroShadow} ${className}`}
      style={{
        animation: visible
          ? 'forgedStaggerIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) both'
          : 'none',
        opacity: visible ? undefined : 0,
        transform: visible ? undefined : 'translateY(16px)',
      }}
    >
      {children}
    </div>
  )
}