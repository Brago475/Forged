import { Icon, I } from './Icon'

/** A single data point attached to a calendar date. */
export interface CalendarEntry {
  /** Date string in YYYY-MM-DD format. */
  date: string
  /** Dot/indicator color (hex or CSS color). */
  color: string
  /** Optional label shown in popovers by the parent. */
  label?: string
}

interface CalendarProps {
  /** The currently displayed month. */
  month: Date
  /** Called when the user navigates to a different month. */
  onMonthChange: (date: Date) => void
  /** Data entries to display as indicators on their dates. */
  entries: CalendarEntry[]
  /** Called when the user taps a date. Receives the date string and its entries. */
  onDateClick?: (date: string, dayEntries: CalendarEntry[]) => void
  /** Color legend shown below the grid. */
  legend?: { color: string; label: string }[]
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

/**
 * Reusable monthly calendar grid with colored indicators on dates
 * that have data. The parent handles what happens when a date is
 * clicked (popover, modal, navigation, etc.).
 *
 * Used by: Fasting, Food Log, Workouts, Progress.
 */
export function Calendar({
  month,
  onMonthChange,
  entries,
  onDateClick,
  legend,
}: CalendarProps) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const todayStr = new Date().toISOString().split('T')[0]

  // Build the grid: leading nulls for alignment + day numbers.
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const formatDateStr = (day: number): string => {
    const m = String(monthIndex + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${year}-${m}-${d}`
  }

  const prevMonth = () => onMonthChange(new Date(year, monthIndex - 1, 1))
  const nextMonth = () => onMonthChange(new Date(year, monthIndex + 1, 1))

  return (
    <div>
      {/* Month header with navigation */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest">
          {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            className="w-7 h-7 rounded-lg bg-forged-bg border border-forged-border
              flex items-center justify-center text-forged-text2
              hover:text-forged-text active:scale-95 transition-all"
          >
            <Icon d={I.chevronLeft} size={12} />
          </button>
          <button
            onClick={nextMonth}
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
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />

          const dateStr = formatDateStr(day)
          const dayEntries = entries.filter(e => e.date === dateStr)
          const isToday = dateStr === todayStr
          const hasData = dayEntries.length > 0
          const isClickable = onDateClick && hasData

          return (
            <button
              key={i}
              onClick={() => isClickable && onDateClick(dateStr, dayEntries)}
              disabled={!isClickable}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center
                transition-all duration-150
                ${isToday ? 'ring-1 ring-forged-purple/50' : ''}
                ${hasData ? 'bg-forged-bg' : ''}
                ${isClickable
                  ? 'hover:bg-forged-surface2 hover:scale-105 active:scale-95 cursor-pointer'
                  : 'cursor-default'
                }`}
            >
              <span
                className={`text-xs font-bold
                  ${isToday ? 'text-forged-purple' : hasData ? 'text-forged-text' : 'text-forged-text2'}`}
              >
                {day}
              </span>

              {/* Colored dots for entries */}
              {hasData && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayEntries.slice(0, 3).map((entry, j) => (
                    <div
                      key={j}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
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