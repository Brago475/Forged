import { useState, useEffect, useRef } from 'react'

const I = {
  timer: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  minus: <><line x1="5" y1="12" x2="19" y2="12"/></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: {
  d: React.ReactNode; size?: number; className?: string; sw?: number
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
    strokeLinejoin="round" className={className}>{d}</svg>
}

const REST_DEFAULT_SECONDS = 90
const REST_PRESETS = [60, 90, 120, 180]

/**
 * Fires a tiny beep + haptic buzz when time's up.
 * Self-contained - user can dismiss, adjust duration, or add/subtract 15s.
 */
export function RestTimer({ onDismiss, defaultSeconds = REST_DEFAULT_SECONDS }: {
  onDismiss: () => void
  defaultSeconds?: number
}) {
  const [remaining, setRemaining] = useState<number>(defaultSeconds)
  const [target, setTarget] = useState<number>(defaultSeconds)
  const [done, setDone] = useState<boolean>(false)
  const intervalRef = useRef<number | null>(null)
  const endedRef = useRef<boolean>(false)

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setRemaining(r => {
        if (r <= 1 && !endedRef.current) {
          endedRef.current = true
          try {
            // Haptic on mobile
            if ('vibrate' in navigator) navigator.vibrate([150, 50, 150])
            // Short beep via WebAudio
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.frequency.value = 880
            gain.gain.value = 0.15
            osc.start()
            setTimeout(() => { osc.stop(); ctx.close() }, 220)
          } catch { /* silent */ }
          setDone(true)
          return 0
        }
        return Math.max(0, r - 1)
      })
    }, 1000)
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current) }
  }, [])

  // Auto-dismiss 4 seconds after ring
  useEffect(() => {
    if (!done) return
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [done, onDismiss])

  const adjust = (delta: number) => {
    setRemaining(r => Math.max(5, r + delta))
    setTarget(t => Math.max(5, t + delta))
  }

  const setPreset = (seconds: number) => {
    setRemaining(seconds)
    setTarget(seconds)
    setDone(false)
    endedRef.current = false
  }

  const pct = target > 0 ? (remaining / target) * 100 : 0
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const display = `${mins}:${String(secs).padStart(2, '0')}`

  return (
    <div
      className={`rounded-xl p-3 border transition-all
        ${done
          ? 'bg-forged-green/15 border-forged-green/40'
          : 'bg-yellow-500/10 border-yellow-500/30'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
          ${done ? 'bg-forged-green/25 text-forged-green' : 'bg-yellow-500/20 text-yellow-500'}`}>
          <Icon d={I.timer} size={16} sw={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] font-black uppercase tracking-wider
            ${done ? 'text-forged-green' : 'text-yellow-500'}`}>
            {done ? "Time's up" : 'Rest timer'}
          </p>
          <p className="text-[10px] text-forged-text2 mt-0.5 truncate">
            {done ? 'Next set ready' : `Next set in ${display}`}
          </p>
        </div>
        {!done && (
          <div className="flex items-center gap-1">
            <button onClick={() => adjust(-15)}
              className="w-7 h-7 rounded-lg bg-forged-bg text-forged-text2 hover:text-forged-text active:scale-90 transition-all flex items-center justify-center">
              <Icon d={I.minus} size={12} sw={2.5} />
            </button>
            <div className="bg-forged-bg px-2.5 py-1.5 rounded-lg min-w-[52px] text-center">
              <span className={`text-sm font-black tabular-nums
                ${done ? 'text-forged-green' : 'text-yellow-500'}`}>
                {display}
              </span>
            </div>
            <button onClick={() => adjust(15)}
              className="w-7 h-7 rounded-lg bg-forged-bg text-forged-text2 hover:text-forged-text active:scale-90 transition-all flex items-center justify-center">
              <Icon d={I.plus} size={12} sw={2.5} />
            </button>
          </div>
        )}
        <button onClick={onDismiss}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-forged-text2 hover:text-forged-red active:scale-90 transition-all flex-shrink-0">
          <Icon d={I.x} size={14} sw={2} />
        </button>
      </div>

      {/* Progress bar */}
      {!done && (
        <div className="h-1 bg-forged-bg rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-yellow-500 transition-all duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Preset chips */}
      {!done && (
        <div className="flex gap-1 mt-2">
          {REST_PRESETS.map(s => (
            <button
              key={s} onClick={() => setPreset(s)}
              className={`flex-1 py-1 rounded text-[10px] font-black transition-all
                ${target === s
                  ? 'bg-yellow-500/20 text-yellow-500'
                  : 'bg-forged-bg text-forged-text2 hover:text-forged-text'}`}
            >
              {s < 60 ? `${s}s` : `${Math.round(s / 60)}m`}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}