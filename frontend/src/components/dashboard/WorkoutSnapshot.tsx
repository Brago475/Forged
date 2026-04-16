import { useEffect, useState } from 'react'
import { api } from '../../hooks/api'
import { Icon, I } from '../ui/Icon'
import type { WorkoutLog } from '../../types'

interface WorkoutSnapshotProps {
  onGo: () => void
}

/**
 * Shows the most recent workout log as a one-liner with a "Go" button.
 * Fetches the latest log on mount.
 */
export function WorkoutSnapshot({ onGo }: WorkoutSnapshotProps) {
  const [logs, setLogs] = useState<WorkoutLog[]>([])

  useEffect(() => {
    api.workout.getLogs(1).then(setLogs).catch(console.error)
  }, [])

  const last = logs[0]

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-forged-purple/10 flex items-center justify-center">
          <Icon d={I.workout} size={18} className="text-forged-purple" />
        </div>
        <div>
          <p className="text-sm font-bold text-forged-text">
            {last?.dayName || last?.planType || 'No workout yet'}
          </p>
          <p className="text-xs text-forged-text2">
            {last
              ? new Date(last.date + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Start your first'}
          </p>
        </div>
      </div>
      <button
        onClick={onGo}
        className="px-4 py-2 rounded-xl text-xs font-black bg-forged-purple/10 text-forged-purple
          border border-forged-purple/20 hover:bg-forged-purple hover:text-white
          active:scale-95 transition-all"
      >
        {last ? 'Go' : 'Start'}
      </button>
    </div>
  )
}