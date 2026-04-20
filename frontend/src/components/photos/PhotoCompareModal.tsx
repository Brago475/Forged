import { useState, useRef } from 'react'
import { sortByDateDesc, daysBetween, type ProgressPhoto } from './photosStorage'

const I = {
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: {
  d: React.ReactNode; size?: number; className?: string; sw?: number
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
    strokeLinejoin="round" className={className}>{d}</svg>
}

export function PhotoCompareModal({
  photos,
  onClose,
  initialLeftId,
  initialRightId,
}: {
  photos: ProgressPhoto[]
  onClose: () => void
  initialLeftId?: string
  initialRightId?: string
}) {
  const sorted = sortByDateDesc(photos)
  const [leftId, setLeftId] = useState<string>(initialLeftId ?? sorted[sorted.length - 1]?.id ?? '')
  const [rightId, setRightId] = useState<string>(initialRightId ?? sorted[0]?.id ?? '')
  const [mode, setMode] = useState<'side' | 'slider'>('side')
  const [sliderPos, setSliderPos] = useState<number>(50)
  const [pickerSide, setPickerSide] = useState<'left' | 'right' | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  const left = photos.find(p => p.id === leftId)
  const right = photos.find(p => p.id === rightId)

  const weightDelta = (left?.weight != null && right?.weight != null)
    ? right.weight - left.weight : null
  const daysApart = (left && right) ? daysBetween(left.date, right.date) : 0
  const waistDelta = (left?.measurements?.waist != null && right?.measurements?.waist != null)
    ? right.measurements.waist - left.measurements.waist : null

  const handleShare = async () => {
    if (!left || !right) return
    const text = `My FORGED transformation
${left.date} → ${right.date} (${daysApart} days)
${weightDelta != null ? `Weight: ${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)} lbs` : ''}
${waistDelta != null ? `Waist: ${waistDelta > 0 ? '+' : ''}${waistDelta.toFixed(1)}"` : ''}
forgedgyms.com`
    if (navigator.share) {
      try { await navigator.share({ text, title: 'My transformation' }) } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(text); alert('Copied to clipboard') }
      catch { alert('Share not supported') }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
         onClick={onClose}>
      <div className="bg-forged-surface rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>

        <div className="sticky top-0 bg-forged-surface/95 backdrop-blur-sm border-b border-forged-border p-4 flex items-center justify-between z-10">
          <p className="text-base font-black text-forged-text">Compare</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all">
            <Icon d={I.x} size={18} sw={2} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {/* Mode toggle */}
          <div className="flex bg-forged-bg rounded-xl p-0.5 gap-0.5">
            {(['side', 'slider'] as const).map(m => (
              <button
                key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-black capitalize transition-all
                  ${mode === m ? 'bg-forged-purple text-white' : 'text-forged-text2 hover:text-forged-text'}`}
              >
                {m === 'side' ? 'Side-by-side' : 'Slider'}
              </button>
            ))}
          </div>

          {/* Compare view */}
          {mode === 'side' ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] font-black text-forged-text2 uppercase tracking-wider mb-1.5">Before</p>
                <button onClick={() => setPickerSide('left')} className="w-full block">
                  {left ? (
                    <img src={left.dataUrl} alt="Before" className="w-full aspect-[3/4] object-cover rounded-xl" />
                  ) : (
                    <div className="w-full aspect-[3/4] rounded-xl bg-forged-bg border border-dashed border-forged-border flex items-center justify-center">
                      <p className="text-xs text-forged-text2">Pick photo</p>
                    </div>
                  )}
                </button>
                {left && (
                  <div className="bg-forged-bg rounded-lg p-2 mt-2">
                    <p className="text-[11px] text-forged-text font-black">{left.date}</p>
                    <p className="text-[9px] text-forged-text2 capitalize mt-0.5">
                      {left.angle}{left.weight ? ` · ${left.weight} lbs` : ''}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-[10px] font-black text-forged-text2 uppercase tracking-wider mb-1.5">After</p>
                <button onClick={() => setPickerSide('right')} className="w-full block">
                  {right ? (
                    <img src={right.dataUrl} alt="After" className="w-full aspect-[3/4] object-cover rounded-xl" />
                  ) : (
                    <div className="w-full aspect-[3/4] rounded-xl bg-forged-bg border border-dashed border-forged-border flex items-center justify-center">
                      <p className="text-xs text-forged-text2">Pick photo</p>
                    </div>
                  )}
                </button>
                {right && (
                  <div className="bg-forged-bg rounded-lg p-2 mt-2">
                    <p className="text-[11px] text-forged-text font-black">{right.date}</p>
                    <p className="text-[9px] text-forged-text2 capitalize mt-0.5">
                      {right.angle}{right.weight ? ` · ${right.weight} lbs` : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Slider */
            <div
              ref={sliderRef}
              className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-forged-bg"
              onMouseMove={(e) => {
                if (e.buttons === 1 && sliderRef.current) {
                  const rect = sliderRef.current.getBoundingClientRect()
                  const pos = ((e.clientX - rect.left) / rect.width) * 100
                  setSliderPos(Math.max(0, Math.min(100, pos)))
                }
              }}
              onTouchMove={(e) => {
                if (sliderRef.current) {
                  const rect = sliderRef.current.getBoundingClientRect()
                  const pos = ((e.touches[0].clientX - rect.left) / rect.width) * 100
                  setSliderPos(Math.max(0, Math.min(100, pos)))
                }
              }}
            >
              {left && <img src={left.dataUrl} alt="Before" className="absolute inset-0 w-full h-full object-cover" />}
              {right && (
                <img src={right.dataUrl} alt="After"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                />
              )}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M8 4l-4 8 4 8"/><path d="M16 4l4 8-4 8"/>
                  </svg>
                </div>
              </div>
              <input
                type="range" min={0} max={100} value={sliderPos}
                onChange={e => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              />
            </div>
          )}

          {/* Difference card */}
          {(left && right) && (
            <div className="bg-gradient-to-br from-forged-purple/15 to-forged-purple/5 border border-forged-purple/30 rounded-xl p-4">
              <p className="text-[10px] font-black text-forged-text2 uppercase tracking-wider mb-2">Difference</p>
              <div className="grid grid-cols-3 gap-2">
                <DiffTile
                  value={weightDelta != null
                    ? `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)}`
                    : '—'}
                  label="lbs"
                />
                <DiffTile value={`${daysApart}`} label="days" />
                <DiffTile
                  value={waistDelta != null
                    ? `${waistDelta > 0 ? '+' : ''}${waistDelta.toFixed(1)}"`
                    : '—'}
                  label="waist"
                />
              </div>
            </div>
          )}

          {/* Photo picker strip */}
          {pickerSide && (
            <div className="bg-forged-bg rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-forged-text2 uppercase tracking-wider">
                  Pick {pickerSide === 'left' ? 'before' : 'after'} photo
                </p>
                <button onClick={() => setPickerSide(null)}
                  className="text-[10px] text-forged-text2 font-bold hover:text-forged-text">
                  Close
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {sorted.map(p => {
                  const isSelected = (pickerSide === 'left' && p.id === leftId) || (pickerSide === 'right' && p.id === rightId)
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (pickerSide === 'left') setLeftId(p.id)
                        else setRightId(p.id)
                        setPickerSide(null)
                      }}
                      className={`relative aspect-square rounded-md overflow-hidden transition-all
                        ${isSelected ? 'ring-2 ring-forged-purple' : 'opacity-70 hover:opacity-100'}`}
                    >
                      <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <button
            onClick={handleShare}
            disabled={!left || !right}
            className="w-full py-3 rounded-xl bg-forged-purple text-white font-black text-sm
              hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40
              flex items-center justify-center gap-2"
          >
            <Icon d={I.share} size={14} sw={2.5} />Share comparison
          </button>
        </div>
      </div>
    </div>
  )
}

function DiffTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-black text-forged-purple tabular-nums">{value}</p>
      <p className="text-[9px] text-forged-text2 font-bold mt-0.5">{label}</p>
    </div>
  )
}