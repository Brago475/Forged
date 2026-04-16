import { useEffect, useState } from 'react'
import type { FastingLog } from '../../types'

interface FastingMiniProps {
  fast: FastingLog
}

/**
 * Compact live fasting timer. Ticks every second and shows
 * remaining + elapsed time. Handles NaN-safe startTime parsing.
 */
export function FastingMini({ fast }: FastingMiniProps) {
  const [now, setNow] = useState<number>(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const startMs = new Date(fast.startTime).getTime()

  if (isNaN(startMs)) {
    return (
      <div>
        <p className="text-sm font-bold text-forged-text">Fasting</p>
        <p className="text-xs text-forged-text2">Timer unavailable</p>
      </div>
    )
  }

  const elapsedHours = Math.max((now - startMs) / 3600000, 0)
  const remainingHours = Math.max(fast.targetHours - elapsedHours, 0)

  const remH = Math.floor(remainingHours)
  const remM = Math.floor((remainingHours % 1) * 60)
  const elapH = Math.floor(elapsedHours)
  const elapM = Math.floor((elapsedHours % 1) * 60)

  return (
    <div>
      <p className="text-sm font-black text-forged-green tabular-nums">
        {remH}h {remM}m remaining
      </p>
      <p className="text-xs text-forged-text2">
        {elapH}h {elapM}m elapsed / {fast.targetHours}h window
      </p>
    </div>
  )
}