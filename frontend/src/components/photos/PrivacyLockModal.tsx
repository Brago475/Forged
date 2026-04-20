import { useState, useEffect } from 'react'
import { loadLock, saveLock, hashPin } from './photosStorage'

const I = {
  lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  back: <><path d="M21 12H7"/><polyline points="12 5 5 12 12 19"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: {
  d: React.ReactNode; size?: number; className?: string; sw?: number
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
    strokeLinejoin="round" className={className}>{d}</svg>
}

type Mode = 'enter' | 'set' | 'confirm-new' | 'disable'

export function PrivacyLockModal({
  mode: initialMode,
  onUnlock,
  onClose,
}: {
  mode: 'enter' | 'manage'
  onUnlock: () => void
  onClose: () => void
}) {
  const lock = loadLock()
  const [mode, setMode] = useState<Mode>(
    initialMode === 'enter' ? 'enter'
    : lock.enabled ? 'disable' : 'set'
  )
  const [pin, setPin] = useState<string>('')
  const [firstPin, setFirstPin] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => { setError('') }, [mode])

  const handleDigit = (d: string) => {
    if (pin.length < 4) setPin(pin + d)
  }
  const handleBack = () => setPin(pin.slice(0, -1))
  const handleClear = () => setPin('')

  useEffect(() => {
    if (pin.length === 4) {
      setTimeout(() => handleSubmit(pin), 100)
    }
  }, [pin])

  const handleSubmit = (value: string) => {
    if (mode === 'enter') {
      if (hashPin(value) === lock.hashedPin) {
        onUnlock()
      } else {
        setError('Wrong PIN')
        setPin('')
      }
    } else if (mode === 'set') {
      setFirstPin(value)
      setPin('')
      setMode('confirm-new')
    } else if (mode === 'confirm-new') {
      if (value === firstPin) {
        saveLock({ enabled: true, hashedPin: hashPin(value) })
        onUnlock()
      } else {
        setError('PINs do not match')
        setPin('')
        setFirstPin('')
        setMode('set')
      }
    } else if (mode === 'disable') {
      if (hashPin(value) === lock.hashedPin) {
        saveLock({ enabled: false })
        onClose()
      } else {
        setError('Wrong PIN')
        setPin('')
      }
    }
  }

  const title = mode === 'enter' ? 'Enter PIN'
    : mode === 'set' ? 'Set a PIN'
    : mode === 'confirm-new' ? 'Confirm PIN'
    : 'Disable lock'

  const subtitle = mode === 'enter' ? 'Photos are locked'
    : mode === 'set' ? 'Choose a 4-digit PIN'
    : mode === 'confirm-new' ? 'Enter it again'
    : 'Enter current PIN to turn off'

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[70] flex items-center justify-center p-4">
      <div className="bg-forged-surface rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="w-10 h-10 rounded-xl bg-forged-purple/15 flex items-center justify-center">
            <Icon d={I.lock} size={18} className="text-forged-purple" />
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all">
            <Icon d={I.x} size={18} sw={2} />
          </button>
        </div>

        <p className="text-lg font-black text-forged-text text-center">{title}</p>
        <p className="text-xs text-forged-text2 text-center mt-1">{subtitle}</p>

        {/* Dots */}
        <div className="flex justify-center gap-3 my-6">
          {[0, 1, 2, 3].map(i => (
            <div key={i}
              className={`w-3 h-3 rounded-full transition-all
                ${i < pin.length ? 'bg-forged-purple scale-110' : 'bg-forged-bg border border-forged-border'}`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-forged-red text-center mb-3 font-bold">{error}</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <button
              key={d} onClick={() => handleDigit(d)}
              className="aspect-square rounded-xl bg-forged-bg border border-forged-border text-forged-text text-xl font-black
                hover:border-forged-purple/40 active:scale-95 transition-all"
            >
              {d}
            </button>
          ))}
          <button onClick={handleClear}
            className="aspect-square rounded-xl bg-forged-bg border border-forged-border text-forged-text2 text-[10px] font-black uppercase
              hover:border-forged-purple/40 active:scale-95 transition-all">
            Clear
          </button>
          <button onClick={() => handleDigit('0')}
            className="aspect-square rounded-xl bg-forged-bg border border-forged-border text-forged-text text-xl font-black
              hover:border-forged-purple/40 active:scale-95 transition-all">
            0
          </button>
          <button onClick={handleBack}
            className="aspect-square rounded-xl bg-forged-bg border border-forged-border text-forged-text2
              hover:border-forged-purple/40 active:scale-95 transition-all flex items-center justify-center">
            <Icon d={I.back} size={16} sw={2.2} />
          </button>
        </div>
      </div>
    </div>
  )
}