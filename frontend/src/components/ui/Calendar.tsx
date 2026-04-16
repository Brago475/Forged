import { useState, useRef } from 'react'
import { useClickOutside } from '../../hooks/useClickOutside'
import { Icon, I } from './Icon'

/** A single data point attached to a calendar date. */
export interface CalendarEntry {
  date: string
  color: string
  label?: string
  /** Key from the I icon library to show on the date. */
  iconKey?: keyof typeof I
}

interface CalendarProps {
  month: Date
  onMonthChange: (date: Date) => void
  entries: CalendarEntry[]
  legend?: { color: string; label: string }[]
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

/**
 * Reusable monthly calendar with inline popover.
 * Dates with entries show colored icons. Tapping a date
 * with entries opens an inline detail card anchored to
 * the date, like a subscription tracker.
 */
export function Calendar({
  month,
  onMonthChange,
  entries,
  legend,
}: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useClickOutside(popoverRef, () => setSelectedDate(null))

  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const todayStr = new Date().toISOString().split('T')[0]

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const formatDateStr = (day: number): string => {
    const m = String(monthIndex + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${year}-${m}-${d}`
  }

  const getEntriesForDate = (dateStr: string): CalendarEntry[] =>
    entries.filter(e => e.date === dateStr)

  const selectedEntries = selectedDate ? getEntriesForDate(selectedDate) : []

  const formatSelectedDate = (dateStr: string): string =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })

  return (
    <div>
      {/* Month header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest">
          {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}
            className="w-7 h-7 rounded-lg bg-forged-bg border border-forged-border
              flex items-center justify-center text-forged-text2
              hover:text-forged-text active:scale-95 transition-all"
          >
            <Icon d={I.chevronLeft} size={12} />
          </button>
          <button
            onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))}
            className="w-7 h-7 rounded-lg bg-forged-bg border border-forged-border
              flex items-center justify-center text-forged-text2
              hover:text-forged-text active:scale-95 transition-all"
          >
            <Icon d={I.chevron} size={12} />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((label, i) => (
          <div key={i} className="text-center text-[9px] font-bold text-forged-text2 py-1">
            {label}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="relative">
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />

            const dateStr = formatDateStr(day)
            const dayEntries = getEntriesForDate(dateStr)
            const isToday = dateStr === todayStr
            const hasData = dayEntries.length > 0
            const isSelected = dateStr === selectedDate

            return (
              <button
                key={i}
                onClick={() => {
                  if (hasData) {
                    setSelectedDate(isSelected ? null : dateStr)
                  }
                }}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center
                  transition-all duration-150 relative
                  ${isToday ? 'ring-1.5 ring-forged-purple/50' : ''}
                  ${isSelected ? 'bg-forged-purple/10 scale-105' : ''}
                  ${hasData && !isSelected ? 'bg-forged-bg hover:bg-forged-surface2 hover:scale-105' : ''}
                  ${hasData ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
              >
                <span
                  className={`text-xs font-bold
                    ${isToday ? 'text-forged-purple'
                      : isSelected ? 'text-forged-purple'
                      : hasData ? 'text-forged-text'
                      : 'text-forged-text2'}`}
                >
                  {day}
                </span>

                {/* Icons stacked under date number */}
                {hasData && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {dayEntries.length <= 2 ? (
                      dayEntries.map((entry, j) => (
                        <div
                          key={j}
                          className="w-4 h-4 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: entry.color + '25' }}
                        >
                          <Icon
                            d={I[entry.iconKey || 'clock']}
                            size={10}
                            sw={2}
                            style={{ color: entry.color }}
                          />
                        </div>
                      ))
                    ) : (
                      <>
                        <div
                          className="w-4 h-4 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: dayEntries[0].color + '25' }}
                        >
                          <Icon
                            d={I[dayEntries[0].iconKey || 'clock']}
                            size={10}
                            sw={2}
                            style={{ color: dayEntries[0].color }}
                          />
                        </div>
                        <span className="text-[8px] font-black text-forged-text2">
                          +{dayEntries.length - 1}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Inline popover */}
        {selectedDate && selectedEntries.length > 0 && (
          <div
            ref={popoverRef}
            className="absolute left-1/2 -translate-x-1/2 mt-2 w-[260px] z-30
              bg-forged-surface border border-forged-border rounded-2xl
              shadow-2xl shadow-black/20 overflow-hidden"
            style={{ animation: 'fadeSlide 0.15s ease-out' }}
          >
            {/* Popover header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <p className="text-xs font-black text-forged-text">
                {formatSelectedDate(selectedDate)}
              </p>
              <button
                onClick={() => setSelectedDate(null)}
                className="w-6 h-6 rounded-md flex items-center justify-center
                  text-forged-text2 hover:text-forged-text transition-colors"
              >
                <Icon d={I.x} size={12} />
              </button>
            </div>

            {/* Entries list */}
            <div className="px-3 pb-3 flex flex-col gap-1.5">
              {selectedEntries.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                    bg-forged-bg border border-forged-border"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: entry.color + '18' }}
                  >
                    <Icon
                      d={I[entry.iconKey || 'clock']}
                      size={16}
                      sw={2}
                      style={{ color: entry.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-forged-text truncate">
                      {entry.label || 'Activity'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {legend && legend.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-forged-text2/10">
          {legend.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[9px] text-forged-text2 font-bold">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}