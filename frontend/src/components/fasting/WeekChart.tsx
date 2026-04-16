import { Card } from '../ui/Card'
import { SectionLabel } from '../ui/SectionLabel'
import { getPreset, type FastRecord } from './fastingConstants'

interface WeekChartProps {
  history: FastRecord[]
  delay?: number
}

/**
 * Horizontal bar chart showing fasting hours for the last 7 days.
 * Bars are colored by the preset that was used.
 */
export function WeekChart({ history, delay = 260 }: WeekChartProps) {
  const days: { label: string; hours: number; color: string }[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayFasts = history.filter(r => r.date === dateStr)
    const totalHours = dayFasts.reduce((sum, r) => sum + r.hours, 0)
    const color = dayFasts.length > 0
      ? getPreset(dayFasts[0].hours).color
      : '#333'

    days.push({
      label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      hours: totalHours,
      color,
    })
  }

  const maxHours = Math.max(...days.map(d => d.hours), 24)

  return (
    <Card delay={delay}>
      <SectionLabel>Last 7 Days</SectionLabel>
      <div>
        <div className="flex items-end gap-2 h-28">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              {d.hours > 0 && (
                <span className="text-[9px] font-bold text-forged-text tabular-nums">
                  {d.hours}h
                </span>
              )}
              <div
                className="w-full rounded-t-lg transition-all duration-500"
                style={{
                  height: `${d.hours > 0
                    ? Math.max((d.hours / maxHours) * 100, 8)
                    : 4
                  }%`,
                  backgroundColor: d.hours > 0 ? d.color : 'var(--border)',
                  opacity: d.hours > 0 ? 0.8 : 0.3,
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-1.5">
          {days.map((d, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-[9px] text-forged-text2 font-bold">
                {d.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}