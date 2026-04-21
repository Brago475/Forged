import { useEffect, useState, type ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  tabKey: string
}

/**
 * Tab-switch transition: soft cross-fade between tabs.
 * No skeleton bridge - each tab handles its own loading.
 */
export function PageTransition({ children, tabKey }: PageTransitionProps) {
  const [displayKey, setDisplayKey] = useState<string>(tabKey)
  const [content, setContent] = useState<ReactNode>(children)
  const [fading, setFading] = useState<boolean>(false)

  useEffect(() => {
    if (tabKey === displayKey) {
      setContent(children)
      return
    }

    setFading(true)
    const swap = setTimeout(() => {
      setContent(children)
      setDisplayKey(tabKey)
      setFading(false)
    }, 150)

    return () => clearTimeout(swap)
  }, [tabKey, displayKey, children])

  return (
    <div
      style={{
        opacity: fading ? 0 : 1,
        transition: 'opacity 150ms ease',
      }}
    >
      {content}
    </div>
  )
}