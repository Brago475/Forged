import { useEffect, useRef, useState, type ReactNode } from 'react'
import { DashboardSkeleton } from '../loading/DashboardSkeleton'

interface PageTransitionProps {
  children: ReactNode
  /** Stable key that changes when the user switches tabs. */
  tabKey: string
}

type Phase = 'out' | 'skeleton' | 'in'

/**
 * Tab-switch transition: fade out (100ms) then skeleton bridge (300ms)
 * then stagger-in of the new tab's content. Smooths over abrupt swaps
 * and gives the brain a moment to register the context change.
 */
export function PageTransition({ children, tabKey }: PageTransitionProps) {
  const [phase, setPhase] = useState<Phase>('in')
  const [displayKey, setDisplayKey] = useState<string>(tabKey)
  const [content, setContent] = useState<ReactNode>(children)
  const isFirstRender = useRef<boolean>(true)

  // Drive the fade-out to skeleton to in sequence when the tab changes.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (tabKey === displayKey) return

    setPhase('out')

    const fadeTimer = setTimeout(() => {
      setPhase('skeleton')
      setContent(children)
      setDisplayKey(tabKey)

      const revealTimer = setTimeout(() => setPhase('in'), 300)
      return () => clearTimeout(revealTimer)
    }, 100)

    return () => clearTimeout(fadeTimer)
  }, [tabKey, displayKey, children])

  // Keep content fresh when children update without a tab change.
  useEffect(() => {
    if (tabKey === displayKey) setContent(children)
  }, [children, tabKey, displayKey])

  if (phase === 'skeleton') {
    return <DashboardSkeleton />
  }

  return (
    <div
      style={{
        opacity: phase === 'out' ? 0 : 1,
        transition: phase === 'out' ? 'opacity 100ms ease' : 'none',
      }}
    >
      {content}
    </div>
  )
}