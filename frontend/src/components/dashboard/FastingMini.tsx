import { useEffect, useState } from 'react'
import type { FastingLog } from '../../types'

interface FastingMiniProps {
  fast: FastingLog
}

/**
 * Compact live fasting timer for the Dashboard hero card.
 * Ticks every second. Shows h:m:s remaining.
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
  const isComplete = remainingHours <= 0

  const totalSeconds = Math.floor(remainingHours * 3600)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60

  return (
    <div>
      <p className={`text-sm font-black tabular-nums ${isComplete ? 'text-forged-purple' : 'text-forged-green'}`}>
        {isComplete
          ? 'Fast complete!'
          : `${h}h ${m}m ${s}s left`
        }
      </p>
      <p className="text-xs text-forged-text2">
        {fast.targetHours}h {isComplete ? 'fast finished' : 'fast in progress'}
      </p>
    </div>
  )
}