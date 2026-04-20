import { useState, useEffect } from 'react'
import type { ProgressPhoto } from './photosStorage'

const I = {
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  chevR: <><path d="M9 18l6-6-6-6"/></>,
  ghost: <><path d="M9 9.5C9 8.67 9.67 8 10.5 8s1.5.67 1.5 1.5"/><path d="M14 9.5C14 8.67 14.67 8 15.5 8s1.5.67 1.5 1.5"/><path d="M4 22V9.5C4 5.5 7.5 2 12 2s8 3.5 8 7.5V22l-4-2-2 2-2-2-2 2-2-2-4 2z"/></>,
  edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: {
  d: React.ReactNode; size?: number; className?: string; sw?: number
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
    strokeLinejoin="round" className={className}>{d}</svg>
}

export function PhotoViewerModal({
  photos,
  startIndex,
  onClose,
  onDelete,
  firstDate,
}: {
  photos: ProgressPhoto[]
  startIndex: number
  onClose: () => void
  onDelete: (id: string) => void
  firstDate?: string
}) {
  const [index, setIndex] = useState<number>(startIndex)
  const [poseGuide, setPoseGuide] = useState<boolean>(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false)

  const photo = photos[index]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, photos.length])

  useEffect(() => {
    setConfirmDelete(false)
  }, [index])

  const go = (direction: 1 | -1) => {
    const next = index + direction
    if (next >= 0 && next < photos.length) setIndex(next)
  }

  const onTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX)
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX == null) return
    const diff = e.changedTouches[0].clientX - touchStartX
    if (Math.abs(diff) > 50) go(diff < 0 ? 1 : -1)
    setTouchStartX(null)
  }

  // Pose guide uses previous photo of same angle as the silhouette
  const poseGuideSource = poseGuide
    ? photos.slice(index + 1).find(p => p.angle === photo.angle)
    : undefined

  const dayCount = firstDate ? Math.round(
    (new Date(photo.date + 'T00:00:00').getTime() - new Date(firstDate + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)
  ) : undefined

  if (!photo) return null

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-2 p-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-20">
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur-md text-white flex items-center justify-center active:scale-95 transition-all">
          <Icon d={I.chevL} size={16} sw={2.2} />
        </button>

        <div className="flex-1 flex gap-1">
          {photos.map((_, i) => (
            <div key={i}
              className={`flex-1 h-0.5 rounded-full transition-all
                ${i === index ? 'bg-white' : i < index ? 'bg-white/50' : 'bg-white/20'}`} />
          ))}
        </div>

        {poseGuideSource && (
          <button
            onClick={() => setPoseGuide(!poseGuide)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black backdrop-blur-md active:scale-95 transition-all
              ${poseGuide
                ? 'bg-forged-purple/80 text-white'
                : 'bg-black/60 text-white border border-white/10'}`}
          >
            <Icon d={I.ghost} size={12} sw={2.2} className="inline mr-1" />
            Pose
          </button>
        )}
      </div>

      {/* Image */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img src={photo.dataUrl} alt={photo.angle}
          className="max-h-full max-w-full object-contain" />

        {/* Pose guide overlay */}
        {poseGuide && poseGuideSource && (
          <img
            src={poseGuideSource.dataUrl}
            alt="Pose guide"
            className="absolute inset-0 m-auto max-h-full max-w-full object-contain pointer-events-none"
            style={{ opacity: 0.25, mixBlendMode: 'difference' }}
          />
        )}

        {/* Nav arrows */}
        {index > 0 && (
          <button
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md text-white flex items-center justify-center active:scale-95 transition-all"
          >
            <Icon d={I.chevL} size={18} sw={2.5} />
          </button>
        )}
        {index < photos.length - 1 && (
          <button
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md text-white flex items-center justify-center active:scale-95 transition-all"
          >
            <Icon d={I.chevR} size={18} sw={2.5} />
          </button>
        )}

        {/* Angle badge */}
        <div className="absolute bottom-3 right-3 bg-forged-purple/80 backdrop-blur-md px-2.5 py-1 rounded-md">
          <p className="text-[10px] font-black text-white uppercase">{photo.angle}</p>
        </div>
      </div>

      {/* Info panel */}
      <div className="bg-forged-surface border-t border-forged-border p-4 max-h-[45vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-base font-black text-forged-text">
              {new Date(photo.date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              })}
            </p>
            <p className="text-[11px] text-forged-text2 mt-0.5">
              {photo.angle}
              {photo.weight ? ` · ${photo.weight} lbs` : ''}
              {dayCount !== undefined ? ` · Day ${dayCount}` : ''}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => {
                if (confirmDelete) {
                  onDelete(photo.id)
                  if (photos.length === 1) onClose()
                  else setIndex(Math.max(0, index - 1))
                } else {
                  setConfirmDelete(true)
                }
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95
                ${confirmDelete
                  ? 'bg-forged-red text-white'
                  : 'bg-forged-bg border border-forged-border text-forged-text2 hover:text-forged-red hover:border-forged-red/40'}`}
            >
              <Icon d={I.trash} size={14} sw={2} />
            </button>
          </div>
        </div>

        {photo.measurements && Object.keys(photo.measurements).length > 0 && (
          <div className="bg-forged-bg rounded-xl p-3 mb-3">
            <p className="text-[9px] font-black text-forged-text2 uppercase tracking-wider mb-2">Measurements</p>
            <div className="grid grid-cols-4 gap-2">
              {photo.measurements.waist != null && <Measurement label="Waist" value={photo.measurements.waist} />}
              {photo.measurements.chest != null && <Measurement label="Chest" value={photo.measurements.chest} />}
              {photo.measurements.arms != null && <Measurement label="Arms" value={photo.measurements.arms} />}
              {photo.measurements.thighs != null && <Measurement label="Thighs" value={photo.measurements.thighs} />}
            </div>
          </div>
        )}

        {photo.note && (
          <div className="bg-forged-bg rounded-xl p-3 mb-2">
            <p className="text-[9px] font-black text-forged-text2 uppercase tracking-wider mb-1">Note</p>
            <p className="text-xs text-forged-text leading-relaxed">{photo.note}</p>
            {photo.tags && photo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {photo.tags.map(t => (
                  <span key={t} className="text-[9px] font-black px-2 py-0.5 rounded-full bg-forged-purple/15 text-forged-purple">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Measurement({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-sm font-black text-forged-text tabular-nums">{value}"</p>
      <p className="text-[9px] text-forged-text2 font-bold mt-0.5">{label}</p>
    </div>
  )
}