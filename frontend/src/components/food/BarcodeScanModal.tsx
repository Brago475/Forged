import { useState, useEffect, useRef } from 'react'
import type { CustomFood } from './customFoodsStorage'
import { addCustomFood, findCustomByBarcode } from './customFoodsStorage'

const I = {
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  barcode: <><path d="M3 5v14"/><path d="M8 5v14"/><path d="M12 5v14"/><path d="M17 5v14"/><path d="M21 5v14"/></>,
  zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: {
  d: React.ReactNode; size?: number; className?: string; sw?: number
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
    strokeLinejoin="round" className={className}>{d}</svg>
}

// BarcodeDetector isn't in standard TypeScript DOM typings yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BarcodeDetectorCtor = (globalThis as any).BarcodeDetector

export function BarcodeScanModal({
  onCapture,
  onClose,
}: {
  onCapture: (food: CustomFood) => void
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [phase, setPhase] = useState<'scanning' | 'form' | 'manual-entry'>('scanning')
  const [scannerAvailable, setScannerAvailable] = useState<boolean>(!!BarcodeDetectorCtor)
  const [detectedBarcode, setDetectedBarcode] = useState<string>('')
  const [manualBarcode, setManualBarcode] = useState<string>('')

  // Form fields for the new food
  const [name, setName] = useState<string>('')
  const [brand, setBrand] = useState<string>('')
  const [servingSize, setServingSize] = useState<string>('1')
  const [servingUnit, setServingUnit] = useState<string>('serving')
  const [calories, setCalories] = useState<string>('')
  const [protein, setProtein] = useState<string>('')
  const [carbs, setCarbs] = useState<string>('')
  const [fat, setFat] = useState<string>('')
  const [fiber, setFiber] = useState<string>('')
  const [sugar, setSugar] = useState<string>('')
  const [sodium, setSodium] = useState<string>('')

  // Start camera and scanner
  useEffect(() => {
    if (!scannerAvailable || phase !== 'scanning') return

    let cancelled = false
    let detector: any = null

    const run = async () => {
      try {
        detector = new BarcodeDetectorCtor({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'],
        })
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        const loop = async () => {
          if (cancelled || !videoRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes.length > 0) {
              handleBarcodeFound(codes[0].rawValue)
              return
            }
          } catch { /* continue */ }
          requestAnimationFrame(loop)
        }
        loop()
      } catch (e) {
        console.error('Camera / scanner error:', e)
        setScannerAvailable(false)
      }
    }

    run()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [scannerAvailable, phase])

  const handleBarcodeFound = (code: string) => {
    // Check if we already have this food saved
    const existing = findCustomByBarcode(code)
    if (existing) {
      streamRef.current?.getTracks().forEach(t => t.stop())
      onCapture(existing)
      return
    }
    setDetectedBarcode(code)
    streamRef.current?.getTracks().forEach(t => t.stop())
    setPhase('form')
  }

  const handleManualSubmit = () => {
    if (!manualBarcode.trim()) return
    handleBarcodeFound(manualBarcode.trim())
  }

  const handleSave = () => {
    if (!name.trim()) return
    const food = addCustomFood({
      name: name.trim(),
      brand: brand.trim() || undefined,
      barcode: detectedBarcode || undefined,
      servingSize: parseFloat(servingSize) || 1,
      servingUnit: servingUnit.trim() || 'serving',
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      fiber: parseFloat(fiber) || 0,
      sugar: parseFloat(sugar) || 0,
      sodium: parseFloat(sodium) || 0,
      source: 'barcode',
    })
    onCapture(food)
  }

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col">
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-2">
          <Icon d={I.barcode} size={18} className="text-forged-purple" />
          <p className="text-sm font-black text-white">
            {phase === 'scanning' ? 'Scan barcode' : phase === 'manual-entry' ? 'Manual entry' : 'New product'}
          </p>
        </div>
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur-md text-white flex items-center justify-center active:scale-95 transition-all">
          <Icon d={I.x} size={18} sw={2} />
        </button>
      </div>

      {/* Scanner phase */}
      {phase === 'scanning' && scannerAvailable && (
        <div className="flex-1 relative">
          <video ref={videoRef} playsInline muted
            className="w-full h-full object-cover" />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-72 h-40 border-2 border-forged-purple rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-forged-purple rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-forged-purple rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-forged-purple rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-forged-purple rounded-br-lg" />
              <div className="absolute inset-x-0 top-1/2 h-[1px] bg-forged-purple opacity-70 animate-pulse" />
            </div>
          </div>
          <div className="absolute bottom-8 left-4 right-4 text-center">
            <p className="text-white/90 text-sm font-black">Point at a product barcode</p>
            <p className="text-white/60 text-xs mt-1">Holds steady in good light</p>
            <button
              onClick={() => setPhase('manual-entry')}
              className="mt-4 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md text-white text-xs font-black
                border border-white/20 hover:bg-white/20 active:scale-95 transition-all"
            >
              Enter barcode manually
            </button>
          </div>
        </div>
      )}

      {/* Scanner unavailable */}
      {phase === 'scanning' && !scannerAvailable && (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-forged-purple/15 flex items-center justify-center mb-3">
              <Icon d={I.barcode} size={28} className="text-forged-purple" />
            </div>
            <p className="text-white font-black">Scanner not available</p>
            <p className="text-white/60 text-xs mt-1 max-w-xs">
              Your browser doesn't support live barcode scanning. Enter the barcode manually to continue.
            </p>
            <button
              onClick={() => setPhase('manual-entry')}
              className="mt-4 px-5 py-2.5 rounded-xl bg-forged-purple text-white text-sm font-black
                hover:brightness-110 active:scale-95 transition-all"
            >
              Enter manually
            </button>
          </div>
        </div>
      )}

      {/* Manual entry phase */}
      {phase === 'manual-entry' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-forged-surface border border-forged-border rounded-2xl p-5 w-full max-w-sm">
            <p className="text-base font-black text-forged-text">Enter barcode</p>
            <p className="text-[11px] text-forged-text2 mt-1">
              Type the numbers printed under the barcode on the package.
            </p>
            <input
              type="text" inputMode="numeric" value={manualBarcode}
              onChange={e => setManualBarcode(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="0123456789012" autoFocus
              className="w-full mt-3 px-3 py-2.5 bg-forged-bg border border-forged-border rounded-xl
                text-forged-text text-base tabular-nums tracking-widest text-center
                focus:border-forged-purple/50 outline-none transition-colors"
            />
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => setPhase('scanning')}
                className="py-2.5 rounded-xl text-xs font-black bg-forged-bg border border-forged-border
                  text-forged-text2 hover:text-forged-text active:scale-[0.98] transition-all"
              >
                Back to camera
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={!manualBarcode.trim()}
                className="py-2.5 rounded-xl text-xs font-black bg-forged-purple text-white
                  hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form phase */}
      {phase === 'form' && (
        <div className="flex-1 bg-forged-surface overflow-y-auto pt-14">
          <div className="p-4">
            <div className="bg-forged-purple/10 border border-forged-purple/30 rounded-xl p-3 mb-4 flex items-center gap-2">
              <Icon d={I.zap} size={14} className="text-forged-purple" />
              <div className="flex-1">
                <p className="text-xs font-black text-forged-text">New product captured</p>
                {detectedBarcode && (
                  <p className="text-[10px] text-forged-text2 font-mono mt-0.5">{detectedBarcode}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Field label="Name" value={name} onChange={setName} placeholder="Product name" autoFocus required />
              <Field label="Brand" value={brand} onChange={setBrand} placeholder="Optional" />

              <div>
                <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">
                  Serving size <span className="text-forged-text2 normal-case">(per label)</span>
                </label>
                <div className="grid grid-cols-[1fr_1.4fr] gap-2">
                  <input
                    type="number" value={servingSize} onChange={e => setServingSize(e.target.value)}
                    step="0.1"
                    className="px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm tabular-nums focus:border-forged-purple/50 outline-none transition-colors"
                  />
                  <input
                    type="text" value={servingUnit} onChange={e => setServingUnit(e.target.value)}
                    placeholder="g, oz, cup, serving..."
                    className="px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm focus:border-forged-purple/50 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-forged-text2 uppercase tracking-wider mb-1.5">Per serving</p>
                <div className="grid grid-cols-2 gap-2">
                  <Macro label="Calories" value={calories} onChange={setCalories} unit="cal" />
                  <Macro label="Protein" value={protein} onChange={setProtein} unit="g" />
                  <Macro label="Carbs" value={carbs} onChange={setCarbs} unit="g" />
                  <Macro label="Fat" value={fat} onChange={setFat} unit="g" />
                  <Macro label="Fiber" value={fiber} onChange={setFiber} unit="g" />
                  <Macro label="Sugar" value={sugar} onChange={setSugar} unit="g" />
                </div>
                <div className="mt-2">
                  <Macro label="Sodium" value={sodium} onChange={setSodium} unit="mg" />
                </div>
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
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, required, autoFocus }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean; autoFocus?: boolean
}) {
  return (
    <div>
      <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">
        {label}{required && <span className="text-forged-red ml-0.5">*</span>}
      </label>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoFocus={autoFocus}
        className="w-full px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm focus:border-forged-purple/50 outline-none transition-colors"
      />
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