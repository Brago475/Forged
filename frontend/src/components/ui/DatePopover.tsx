import { useRef } from 'react'
import { useClickOutside } from '../../hooks/useClickOutside'
import { Icon, I } from './Icon'
import type { CalendarEntry } from './Calendar'

interface DatePopoverProps {
  date: string
  entries: CalendarEntry[]
  onClose: () => void
}

/**
 * Floating popover that appears when a calendar date is tapped.
 * Shows all entries for that date with colored indicators.
 * Closes on click-outside or the X button.
 */
export function DatePopover({ date, entries, onClose }: DatePopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, onClose)

  const formatted = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        ref={ref}
        className="bg-forged-surface border border-forged-border rounded-2xl p-5
          shadow-2xl w-[280px] max-h-[400px] overflow-y-auto"
        style={{ animation: 'fadeSlide 0.15s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-black text-forged-text">{formatted}</p>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center
              text-forged-text2 hover:text-forged-text transition-colors"
          >
            <Icon d={I.x} size={14} />
          </button>
        </div>

        {/* Entries */}
        {entries.length === 0 ? (
          <p className="text-xs text-forged-text2 text-center py-4">
            No activity on this date
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl
                  bg-forged-bg border border-forged-border"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: entry.color + '18' }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                </div>
                <p className="text-sm font-medium text-forged-text flex-1">
                  {entry.label || 'Activity'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}