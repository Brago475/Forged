import { useState, useEffect, useMemo } from 'react'
import {
  loadPhotos, addPhoto, deletePhoto,
  loadLock, getFirstAndLatest, filterByAngle, sortByDateDesc,
  daysBetween, downloadJson, exportAsPdf,
  type ProgressPhoto, type PhotoAngle,
} from '../components/photos/photosStorage'
import { PhotoAddModal } from '../components/photos/PhotoAddModal'
import { PhotoViewerModal } from '../components/photos/PhotoViewerModal'
import { PhotoCompareModal } from '../components/photos/PhotoCompareModal'
import { PhotoCalendarView } from '../components/photos/PhotoCalendarView'
import { PhotoTimelineView } from '../components/photos/PhotoTimelineView'
import { PrivacyLockModal } from '../components/photos/PrivacyLockModal'

const I = {
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
  lockOpen: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></>,
  download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: {
  d: React.ReactNode; size?: number; className?: string; sw?: number
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
    strokeLinejoin="round" className={className}>{d}</svg>
}

export default function ProgressPhotosPage({ onBack }: { onBack: () => void }) {
  const lock = loadLock()
  const [photos, setPhotos] = useState<ProgressPhoto[]>(loadPhotos)
  const [unlocked, setUnlocked] = useState<boolean>(!lock.enabled)
  const [showLockModal, setShowLockModal] = useState<boolean>(false)
  const [lockManageMode, setLockManageMode] = useState<boolean>(false)

  const [angleFilter, setAngleFilter] = useState<PhotoAngle | 'all'>('all')
  const [view, setView] = useState<'timeline' | 'compare' | 'calendar'>('timeline')

  const [addOpen, setAddOpen] = useState<boolean>(false)
  const [viewerOpen, setViewerOpen] = useState<boolean>(false)
  const [viewerStartId, setViewerStartId] = useState<string | null>(null)
  const [compareOpen, setCompareOpen] = useState<boolean>(false)
  const [exportMenu, setExportMenu] = useState<boolean>(false)

  const filtered = useMemo(() => sortByDateDesc(filterByAngle(photos, angleFilter)), [photos, angleFilter])
  const { first, latest } = useMemo(() => getFirstAndLatest(photos), [photos])
  const firstDate = useMemo(() => {
    if (photos.length === 0) return undefined
    const sorted = [...photos].sort((a, b) => a.date.localeCompare(b.date))
    return sorted[0].date
  }, [photos])

  // Re-check lock when modal closes
  useEffect(() => {
    if (!showLockModal && !lockManageMode) {
      const current = loadLock()
      if (!current.enabled) setUnlocked(true)
    }
  }, [showLockModal, lockManageMode])

  const handleAddPhoto = (photo: ProgressPhoto) => {
    const next = addPhoto(photo)
    setPhotos(next)
    setAddOpen(false)
  }

  const handleDelete = (id: string) => {
    const next = deletePhoto(id)
    setPhotos(next)
  }

  const openViewer = (photoId: string) => {
    setViewerStartId(photoId)
    setViewerOpen(true)
  }

  const weightDelta = (first?.weight != null && latest?.weight != null)
    ? latest.weight - first.weight : null

  // If locked, show lock screen
  if (lock.enabled && !unlocked) {
    return (
      <>
        <div className="flex flex-col gap-4 items-center justify-center min-h-[70vh]">
          <div className="w-16 h-16 rounded-2xl bg-forged-purple/15 flex items-center justify-center">
            <Icon d={I.lock} size={28} className="text-forged-purple" />
          </div>
          <p className="text-lg font-black text-forged-text">Photos are locked</p>
          <p className="text-xs text-forged-text2 text-center max-w-xs">Enter your PIN to access your progress photos.</p>
          <button
            onClick={() => { setLockManageMode(false); setShowLockModal(true) }}
            className="px-6 py-2.5 rounded-xl bg-forged-purple text-white font-black text-sm
              hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Unlock
          </button>
          <button onClick={onBack} className="text-xs text-forged-text2 font-bold hover:text-forged-text">
            Back
          </button>
        </div>
        {showLockModal && (
          <PrivacyLockModal
            mode="enter"
            onUnlock={() => { setUnlocked(true); setShowLockModal(false) }}
            onClose={() => setShowLockModal(false)}
          />
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-20 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border
              flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all">
            <Icon d={I.chevL} size={16} />
          </button>
          <h1 className="text-2xl font-black text-forged-text">Progress</h1>
        </div>
        <div className="flex gap-2 relative">
          <button
            onClick={() => { setLockManageMode(true); setShowLockModal(true) }}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center active:scale-95 transition-all
              ${lock.enabled
                ? 'bg-forged-purple/15 border-forged-purple/40 text-forged-purple'
                : 'bg-forged-surface border-forged-border text-forged-text2 hover:text-forged-text'}`}
            title={lock.enabled ? 'Lock enabled' : 'Enable PIN lock'}
          >
            <Icon d={lock.enabled ? I.lock : I.lockOpen} size={14} sw={2} />
          </button>
          <button
            onClick={() => setExportMenu(!exportMenu)}
            className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border
              flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all"
            title="Export"
          >
            <Icon d={I.download} size={14} sw={2} />
          </button>
          {exportMenu && (
            <div className="absolute top-full right-0 mt-2 w-44 bg-forged-surface border border-forged-border rounded-xl shadow-xl z-20 overflow-hidden">
              <button
                onClick={() => { downloadJson(photos); setExportMenu(false) }}
                className="w-full px-3 py-2.5 text-left text-xs font-bold text-forged-text hover:bg-forged-bg transition-colors"
              >
                Export as JSON
              </button>
              <button
                onClick={() => { exportAsPdf(photos); setExportMenu(false) }}
                className="w-full px-3 py-2.5 text-left text-xs font-bold text-forged-text hover:bg-forged-bg transition-colors border-t border-forged-border"
              >
                Export as PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Before/After card */}
      {first && latest && first.id !== latest.id && (
        <div className="bg-gradient-to-br from-forged-purple/15 to-forged-purple/5 border border-forged-purple/30 rounded-2xl p-4">
          <p className="text-[10px] font-black text-forged-text2 uppercase tracking-widest mb-3">Before · After</p>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
            <button onClick={() => openViewer(first.id)} className="block">
              <img src={first.dataUrl} alt="Before" className="w-full aspect-[3/4] object-cover rounded-xl" />
              <p className="text-[11px] font-black text-forged-text mt-2 text-left">
                {new Date(first.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
              {first.weight && <p className="text-[10px] text-forged-text2 text-left">{first.weight} lbs</p>}
            </button>
            <div className="text-center">
              <p className="text-2xl font-black text-forged-purple">→</p>
              {weightDelta != null && (
                <p className="text-[10px] text-forged-text2 mt-1 font-bold">
                  {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)} lbs
                </p>
              )}
              <p className="text-[9px] text-forged-text2 mt-0.5">{daysBetween(first.date, latest.date)} days</p>
            </div>
            <button onClick={() => openViewer(latest.id)} className="block">
              <img src={latest.dataUrl} alt="After" className="w-full aspect-[3/4] object-cover rounded-xl" />
              <p className="text-[11px] font-black text-forged-text mt-2 text-left">
                {new Date(latest.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
              {latest.weight && <p className="text-[10px] text-forged-text2 text-left">{latest.weight} lbs</p>}
            </button>
          </div>
        </div>
      )}

      {/* Angle filter */}
      {photos.length > 0 && (
        <div className="flex bg-forged-surface border border-forged-border rounded-xl p-0.5 gap-0.5">
          {(['all', 'front', 'side', 'back'] as const).map(a => (
            <button
              key={a} onClick={() => setAngleFilter(a)}
              className={`flex-1 py-2 rounded-lg text-xs font-black capitalize transition-all
                ${angleFilter === a ? 'bg-forged-purple text-white' : 'text-forged-text2 hover:text-forged-text'}`}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {/* View toggle */}
      {photos.length > 0 && (
        <div className="flex bg-forged-surface border border-forged-border rounded-xl p-0.5 gap-0.5">
          {(['timeline', 'compare', 'calendar'] as const).map(v => (
            <button
              key={v}
              onClick={() => {
                if (v === 'compare') setCompareOpen(true)
                else setView(v)
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-black capitalize transition-all
                ${view === v && v !== 'compare' ? 'bg-forged-purple text-white' : 'text-forged-text2 hover:text-forged-text'}`}
            >
              {v}
            </button>
          ))}
        </div>
      )}

      {/* View body */}
      {photos.length === 0 ? (
        <div className="bg-forged-surface border border-forged-border rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-forged-purple/15 flex items-center justify-center mx-auto mb-3">
            <Icon d={I.user} size={24} className="text-forged-purple" />
          </div>
          <p className="text-sm font-bold text-forged-text mb-1">No photos yet</p>
          <p className="text-xs text-forged-text2 mb-4">Start tracking your visual progress</p>
          <button
            onClick={() => setAddOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-forged-purple text-white font-black text-xs
              hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Add first photo
          </button>
        </div>
      ) : view === 'calendar' ? (
        <PhotoCalendarView photos={filtered} onDayClick={p => openViewer(p.id)} />
      ) : (
        <PhotoTimelineView photos={filtered} onPhotoClick={p => openViewer(p.id)} />
      )}

      {/* FAB */}
      {photos.length > 0 && (
        <button
          onClick={() => setAddOpen(true)}
          className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 w-14 h-14 rounded-2xl bg-forged-purple
            shadow-lg shadow-forged-purple/30 text-white flex items-center justify-center
            hover:brightness-110 active:scale-95 transition-all z-30"
        >
          <Icon d={I.plus} size={22} sw={2.5} />
        </button>
      )}

      {/* Modals */}
      {addOpen && (
        <PhotoAddModal
          onSave={handleAddPhoto}
          onClose={() => setAddOpen(false)}
          defaultWeight={latest?.weight}
        />
      )}
      {viewerOpen && viewerStartId && (() => {
        const startIdx = filtered.findIndex(p => p.id === viewerStartId)
        return (
          <PhotoViewerModal
            photos={filtered}
            startIndex={startIdx >= 0 ? startIdx : 0}
            firstDate={firstDate}
            onClose={() => setViewerOpen(false)}
            onDelete={handleDelete}
          />
        )
      })()}
      {compareOpen && (
        <PhotoCompareModal
          photos={photos}
          onClose={() => setCompareOpen(false)}
          initialLeftId={first?.id}
          initialRightId={latest?.id}
        />
      )}
      {showLockModal && lockManageMode && (
        <PrivacyLockModal
          mode="manage"
          onUnlock={() => setShowLockModal(false)}
          onClose={() => setShowLockModal(false)}
        />
      )}
    </div>
  )
}