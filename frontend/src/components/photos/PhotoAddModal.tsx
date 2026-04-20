import { useState, useRef, useEffect } from 'react'
import type { PhotoAngle, Measurements, ProgressPhoto } from './photosStorage'

const I = {
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  camera: <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: {
  d: React.ReactNode; size?: number; className?: string; sw?: number
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
    strokeLinejoin="round" className={className}>{d}</svg>
}

const COMMON_TAGS = ['morning', 'cut', 'bulk', 'lean', 'pumped', 'post-workout', 'vacation', 'comeback']

export function PhotoAddModal({
  onSave,
  onClose,
  defaultWeight,
}: {
  onSave: (photo: ProgressPhoto) => void
  onClose: () => void
  defaultWeight?: number
}) {
  const [dataUrl, setDataUrl] = useState<string>('')
  const [angle, setAngle] = useState<PhotoAngle>('front')
  const [weight, setWeight] = useState<string>(defaultWeight ? String(defaultWeight) : '')
  const [waist, setWaist] = useState<string>('')
  const [chest, setChest] = useState<string>('')
  const [arms, setArms] = useState<string>('')
  const [thighs, setThighs] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [tags, setTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState<string>('')
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fileRef.current?.click()
  }, [])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setDataUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const toggleTag = (tag: string) => {
    setTags(tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag])
  }

  const addCustomTag = () => {
    const t = customTag.trim().toLowerCase().replace(/^#/, '')
    if (t && !tags.includes(t)) setTags([...tags, t])
    setCustomTag('')
  }

  const handleSave = () => {
    if (!dataUrl) return
    const measurements: Measurements = {}
    if (waist) measurements.waist = parseFloat(waist)
    if (chest) measurements.chest = parseFloat(chest)
    if (arms) measurements.arms = parseFloat(arms)
    if (thighs) measurements.thighs = parseFloat(thighs)

    const photo: ProgressPhoto = {
      id: crypto.randomUUID(),
      date,
      capturedAt: new Date().toISOString(),
      angle,
      dataUrl,
      weight: weight ? parseFloat(weight) : undefined,
      measurements: Object.keys(measurements).length > 0 ? measurements : undefined,
      note: note.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    }
    onSave(photo)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
         onClick={onClose}>
      <div className="bg-forged-surface rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

        <div className="sticky top-0 bg-forged-surface/95 backdrop-blur-sm border-b border-forged-border p-4 flex items-center justify-between z-10">
          <p className="text-base font-black text-forged-text">New Photo</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all">
            <Icon d={I.x} size={18} sw={2} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Photo preview / re-select */}
          {dataUrl ? (
            <div className="relative">
              <img src={dataUrl} alt="Preview" className="w-full aspect-[3/4] object-cover rounded-xl" />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-2 right-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white rounded-lg text-xs font-black hover:bg-black/80 transition-all"
              >
                Retake
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-forged-purple/40 bg-forged-purple/5 flex flex-col items-center justify-center gap-2 hover:bg-forged-purple/10 transition-all"
            >
              <Icon d={I.camera} size={32} className="text-forged-purple" />
              <p className="text-sm font-black text-forged-purple">Tap to take photo</p>
            </button>
          )}

          {/* Date */}
          <div>
            <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">Date</label>
            <input
              type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm focus:border-forged-purple/50 outline-none transition-colors"
            />
          </div>

          {/* Angle */}
          <div>
            <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">Angle</label>
            <div className="grid grid-cols-3 gap-2">
              {(['front', 'side', 'back'] as const).map(a => (
                <button
                  key={a}
                  onClick={() => setAngle(a)}
                  className={`py-2.5 rounded-xl text-xs font-black capitalize transition-all
                    ${angle === a
                      ? 'bg-forged-purple text-white'
                      : 'bg-forged-bg border border-forged-border text-forged-text2 hover:text-forged-text'}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Weight */}
          <div>
            <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">Weight (optional)</label>
            <div className="relative">
              <input
                type="number" value={weight} onChange={e => setWeight(e.target.value)}
                placeholder="e.g. 181.5" step="0.1"
                className="w-full px-3 py-2 pr-12 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm tabular-nums focus:border-forged-purple/50 outline-none transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-forged-text2 font-bold">lbs</span>
            </div>
          </div>

          {/* Measurements */}
          <div>
            <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">Measurements (optional)</label>
            <div className="grid grid-cols-2 gap-2">
              <MeasureInput label="Waist" value={waist} onChange={setWaist} />
              <MeasureInput label="Chest" value={chest} onChange={setChest} />
              <MeasureInput label="Arms" value={arms} onChange={setArms} />
              <MeasureInput label="Thighs" value={thighs} onChange={setThighs} />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">Note (optional)</label>
            <textarea
              value={note} onChange={e => setNote(e.target.value.slice(0, 300))}
              placeholder="How are you feeling today?" rows={3}
              className="w-full px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm focus:border-forged-purple/50 outline-none transition-colors resize-none"
            />
            <p className="text-[9px] text-forged-text2 mt-1 text-right">{note.length} / 300</p>
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full transition-all
                    ${tags.includes(tag)
                      ? 'bg-forged-purple text-white'
                      : 'bg-forged-bg border border-forged-border text-forged-text2 hover:text-forged-text'}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
            {tags.filter(t => !COMMON_TAGS.includes(t)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.filter(t => !COMMON_TAGS.includes(t)).map(tag => (
                  <button
                    key={tag} onClick={() => toggleTag(tag)}
                    className="text-[10px] font-black px-2.5 py-1 rounded-full bg-forged-purple text-white"
                  >
                    #{tag} ×
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text" value={customTag}
                onChange={e => setCustomTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                placeholder="Add custom tag"
                className="flex-1 px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-xs focus:border-forged-purple/50 outline-none transition-colors"
              />
              <button
                onClick={addCustomTag}
                disabled={!customTag.trim()}
                className="px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-purple text-xs font-black hover:bg-forged-purple/10 disabled:opacity-40 transition-all"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-forged-surface border-t border-forged-border p-4">
          <button
            onClick={handleSave}
            disabled={!dataUrl}
            className="w-full py-3 rounded-xl bg-forged-purple text-white font-black text-sm
              hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save photo
          </button>
        </div>
      </div>
    </div>
  )
}

function MeasureInput({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <input
        type="number" value={value} onChange={e => onChange(e.target.value)}
        placeholder={label} step="0.1"
        className="w-full px-3 py-2 pr-8 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm tabular-nums focus:border-forged-purple/50 outline-none transition-colors"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-forged-text2 font-bold">"</span>
    </div>
  )
}