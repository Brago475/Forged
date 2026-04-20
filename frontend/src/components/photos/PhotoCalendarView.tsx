import { useState } from 'react'
import type { ProgressPhoto } from './photosStorage'

const I = {
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  chevR: <><path d="M9 18l6-6-6-6"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: {
  d: React.ReactNode; size?: number; className?: string; sw?: number
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
    strokeLinejoin="round" className={className}>{d}</svg>
}

export function PhotoCalendarView({
  photos,
  onDayClick,
}: {
  photos: ProgressPhoto[]
  onDayClick: (photo: ProgressPhoto) => void
}) {
  const [viewDate, setViewDate] = useState<Date>(new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = (firstDay.getDay() + 6) % 7 // Mon=0
  const daysInMonth = lastDay.getDate()

  const photosByDay: Record<string, ProgressPhoto[]> = {}
  for (const p of photos) {
    const d = new Date(p.date + 'T00:00:00')
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = String(d.getDate())
      if (!photosByDay[key]) photosByDay[key] = []
      photosByDay[key].push(p)
    }
  }

  const cells: Array<{ day: number | null; photo?: ProgressPhoto; extra?: number }> = []
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const dayPhotos = photosByDay[String(d)] ?? []
    cells.push({
      day: d,
      photo: dayPhotos[0],
      extra: dayPhotos.length > 1 ? dayPhotos.length - 1 : undefined,
    })
  }

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-forged-surface border border-forged-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="w-8 h-8 rounded-lg bg-forged-bg border border-forged-border flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all"
        >
          <Icon d={I.chevL} size={14} sw={2.5} />
        </button>
        <p className="text-sm font-black text-forged-text">{monthLabel}</p>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          disabled={year === new Date().getFullYear() && month === new Date().getMonth()}
          className="w-8 h-8 rounded-lg bg-forged-bg border border-forged-border flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 disabled:opacity-30 transition-all"
        >
          <Icon d={I.chevR} size={14} sw={2.5} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[9px] font-black text-forged-text2 uppercase">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (cell.day == null) {
            return <div key={i} className="aspect-square" />
          }
          if (cell.photo) {
            return (
              <button
                key={i}
                onClick={() => onDayClick(cell.photo!)}
                className="aspect-square rounded-md overflow-hidden relative group"
              >
                <img src={cell.photo.dataUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all" />
                <span className="absolute top-0.5 left-1 text-[8px] text-white font-black drop-shadow">
                  {cell.day}
                </span>
                {cell.extra && (
                  <span className="absolute bottom-0.5 right-1 text-[8px] text-white font-black bg-forged-purple/90 rounded px-1">
                    +{cell.extra}
                  </span>
                )}
              </button>
            )
          }
          return (
            <div key={i} className="aspect-square rounded-md bg-forged-bg border border-forged-border flex items-center justify-center">
              <span className="text-[10px] text-forged-text2 font-bold">{cell.day}</span>
            </div>
          )
        })}
      </div>

      <p className="text-[10px] text-forged-text2 text-center mt-3">
        {photos.length === 0 ? 'No photos this month' : `${Object.keys(photosByDay).length} days with photos`}
      </p>
    </div>
  )
}