import { useState, useRef, useEffect } from 'react'
import type { CustomFood } from './customFoodsStorage'
import { addCustomFood } from './customFoodsStorage'

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

export function PhotoFoodModal({
  onCapture,
  onClose,
}: {
  onCapture: (food: CustomFood) => void
  onClose: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [brand, setBrand] = useState<string>('')
  const [servingSize, setServingSize] = useState<string>('1')
  const [servingUnit, setServingUnit] = useState<string>('plate')
  const [calories, setCalories] = useState<string>('')
  const [protein, setProtein] = useState<string>('')
  const [carbs, setCarbs] = useState<string>('')
  const [fat, setFat] = useState<string>('')

  useEffect(() => {
    fileRef.current?.click()
  }, [])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoDataUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!name.trim() || !calories) return
    const food = addCustomFood({
      name: name.trim(),
      brand: brand.trim() || undefined,
      photoDataUrl: photoDataUrl || undefined,
      servingSize: parseFloat(servingSize) || 1,
      servingUnit: servingUnit.trim() || 'serving',
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      source: 'photo',
    })
    onCapture(food)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
         onClick={onClose}>
      <div className="bg-forged-surface rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

        <div className="sticky top-0 bg-forged-surface/95 backdrop-blur-sm border-b border-forged-border p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Icon d={I.camera} size={16} className="text-forged-purple" />
            <p className="text-base font-black text-forged-text">Photo food</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all">
            <Icon d={I.x} size={18} sw={2} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {photoDataUrl ? (
            <div className="relative">
              <img src={photoDataUrl} alt="Food" className="w-full aspect-square object-cover rounded-xl" />
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
              className="w-full aspect-square rounded-xl border-2 border-dashed border-forged-purple/40 bg-forged-purple/5 flex flex-col items-center justify-center gap-2 hover:bg-forged-purple/10 transition-all"
            >
              <Icon d={I.camera} size={32} className="text-forged-purple" />
              <p className="text-sm font-black text-forged-purple">Tap to capture</p>
            </button>
          )}

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">Name *</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Breakfast plate" autoFocus
                className="w-full px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm focus:border-forged-purple/50 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">Description (optional)</label>
              <input
                type="text" value={brand} onChange={e => setBrand(e.target.value)}
                placeholder="e.g. homemade, from Chipotle"
                className="w-full px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm focus:border-forged-purple/50 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">Serving</label>
              <div className="grid grid-cols-[1fr_1.4fr] gap-2">
                <input
                  type="number" value={servingSize} onChange={e => setServingSize(e.target.value)}
                  step="0.1"
                  className="px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm tabular-nums focus:border-forged-purple/50 outline-none transition-colors"
                />
                <input
                  type="text" value={servingUnit} onChange={e => setServingUnit(e.target.value)}
                  placeholder="plate, bowl, portion..."
                  className="px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm focus:border-forged-purple/50 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-forged-text2 uppercase tracking-wider mb-1.5">Estimated macros</p>
              <div className="grid grid-cols-2 gap-2">
                <Macro label="Cal" value={calories} onChange={setCalories} unit="cal" />
                <Macro label="Protein" value={protein} onChange={setProtein} unit="g" />
                <Macro label="Carbs" value={carbs} onChange={setCarbs} unit="g" />
                <Macro label="Fat" value={fat} onChange={setFat} unit="g" />
              </div>
              <p className="text-[10px] text-forged-text2 mt-2 italic leading-relaxed">
                AI estimation coming later. For now, enter what you can — the photo will help you remember.
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-forged-surface border-t border-forged-border p-4">
          <button
            onClick={handleSave}
            disabled={!name.trim() || !calories}
            className="w-full py-3 rounded-xl bg-forged-purple text-white font-black text-sm
              hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            Save & log
          </button>
        </div>
      </div>
    </div>
  )
}

function Macro({ label, value, onChange, unit }: {
  label: string; value: string; onChange: (v: string) => void; unit: string
}) {
  return (
    <div>
      <label className="text-[9px] font-bold text-forged-text2 uppercase block mb-1">{label}</label>
      <div className="relative">
        <input
          type="number" value={value} onChange={e => onChange(e.target.value)}
          step="0.1" placeholder="0"
          className="w-full px-3 py-2 pr-10 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm tabular-nums focus:border-forged-purple/50 outline-none transition-colors"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-forged-text2 font-bold">{unit}</span>
      </div>
    </div>
  )
}