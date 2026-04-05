import { useState, useEffect } from 'react'

const I = {
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  camera: <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: { d: React.ReactNode; size?: number; className?: string; sw?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>{d}</svg>
}

function Card({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [v, setV] = useState(false)
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t) }, [delay])
  return <div className={`bg-forged-surface border border-forged-border rounded-2xl p-5 transition-all duration-500 ease-out hover:border-forged-purple/20 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>{children}</div>
}

interface ProgressPhoto { id: string; date: string; label: string; dataUrl: string }
const PHOTOS_KEY = 'forged_progress_photos'
function loadPhotos(): ProgressPhoto[] { try { return JSON.parse(localStorage.getItem(PHOTOS_KEY) || '[]') } catch { return [] } }
function savePhotos(p: ProgressPhoto[]) { localStorage.setItem(PHOTOS_KEY, JSON.stringify(p)) }

export default function ProgressPhotosPage({ onBack }: { onBack: () => void }) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>(loadPhotos)
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState<'front' | 'side' | 'back'>('front')

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const photo: ProgressPhoto = { id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], label, dataUrl: reader.result as string }
      const next = [photo, ...photos]; setPhotos(next); savePhotos(next); setAdding(false)
    }
    reader.readAsDataURL(file)
  }

  const deletePhoto = (id: string) => { const next = photos.filter(p => p.id !== id); setPhotos(next); savePhotos(next) }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all"><Icon d={I.chevL} size={16} /></button>
        <h1 className="text-2xl font-black text-forged-text">Progress Photos</h1>
      </div>

      <Card delay={60}>
        {!adding ? (
          <button onClick={() => setAdding(true)} className="w-full py-4 rounded-xl font-black text-sm bg-forged-purple text-white shadow-lg shadow-forged-purple/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Icon d={I.camera} size={18} sw={2} /> Add Photo
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold text-forged-text2 uppercase tracking-widest">New Photo</p>
            <div className="grid grid-cols-3 gap-2">
              {(['front', 'side', 'back'] as const).map(l => (
                <button key={l} onClick={() => setLabel(l)} className={`py-2 rounded-lg text-xs font-bold capitalize transition-all ${label === l ? 'bg-forged-purple text-white' : 'bg-forged-bg border border-forged-border text-forged-text2'}`}>{l}</button>
              ))}
            </div>
            <label className="w-full py-3 rounded-xl text-center text-sm font-bold bg-forged-bg border border-dashed border-forged-purple/30 text-forged-purple cursor-pointer hover:bg-forged-purple/5 transition-all">
              Choose Photo
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} />
            </label>
            <button onClick={() => setAdding(false)} className="text-xs text-forged-text2 hover:text-forged-text font-bold">Cancel</button>
          </div>
        )}
      </Card>

      {photos.length === 0 ? (
        <Card delay={140}>
          <div className="py-8 text-center">
            <Icon d={I.camera} size={32} className="text-forged-text2 mx-auto mb-3" />
            <p className="text-sm font-bold text-forged-text mb-1">No photos yet</p>
            <p className="text-xs text-forged-text2">Track your visual progress over time</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, i) => (
            <Card key={photo.id} delay={100 + i * 50} className="!p-3">
              <img src={photo.dataUrl} alt={photo.label} className="w-full aspect-[3/4] object-cover rounded-xl mb-2" />
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-forged-purple uppercase">{photo.label}</span>
                  <p className="text-[10px] text-forged-text2">{new Date(photo.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
                <button onClick={() => deletePhoto(photo.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-forged-text2 hover:text-forged-red hover:bg-forged-red/10 transition-all"><Icon d={I.trash} size={12} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}