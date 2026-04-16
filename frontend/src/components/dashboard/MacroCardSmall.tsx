interface MacroCardSmallProps {
  label: string
  value: string
  /** 0 to 1. Fill percentage for the progress bar. */
  pct: number
}

/**
 * Compact macro card for secondary nutrients (fiber, water).
 * No count-up animation, just a static value and thin progress bar.
 */
export function MacroCardSmall({ label, value, pct }: MacroCardSmallProps) {
  return (
    <div className="bg-forged-bg border border-forged-border rounded-xl p-3 hover:border-forged-purple/30 transition-all duration-200">
      <div className="flex justify-between items-center mb-2">
        <p className="text-[10px] text-forged-text2 font-bold uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-black text-forged-text tabular-nums">{value}</p>
      </div>
      <div className="h-1.5 rounded-full bg-forged-surface2 overflow-hidden">
        <div
          className="h-full rounded-full bg-forged-purple/60 transition-all duration-700"
          style={{ width: `${Math.min(pct * 100, 100)}%` }}
        />
      </div>
    </div>
  )
}