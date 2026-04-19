interface MacroBarProps {
  protein: number
  carbs: number
  fat: number
  /** Total calories label on the right, if provided. */
  totalLabel?: string
  /** Compact height (for list rows) */
  compact?: boolean
}

/**
 * Single stacked bar showing macro calorie contribution (P/C/F).
 * Way clearer than "P:0g · C:0g · F:0g" text.
 */
export function MacroBar({ protein, carbs, fat, totalLabel, compact = false }: MacroBarProps) {
  const pCal = protein * 4
  const cCal = carbs * 4
  const fCal = fat * 9
  const total = pCal + cCal + fCal

  if (total === 0) {
    return (
      <div className="flex items-center gap-2">
        <div className={`flex-1 rounded-full bg-forged-surface2 ${compact ? 'h-1.5' : 'h-2'}`} />
        {totalLabel && (
          <span className="text-[10px] text-forged-text2 tabular-nums">{totalLabel}</span>
        )}
      </div>
    )
  }

  const pPct = (pCal / total) * 100
  const cPct = (cCal / total) * 100
  const fPct = (fCal / total) * 100

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 rounded-full overflow-hidden flex ${compact ? 'h-1.5' : 'h-2'} bg-forged-surface2`}>
        {pPct > 0 && (
          <div
            className="h-full"
            style={{ width: `${pPct}%`, backgroundColor: '#9b59b6' }}
            title={`Protein: ${protein}g`}
          />
        )}
        {cPct > 0 && (
          <div
            className="h-full"
            style={{ width: `${cPct}%`, backgroundColor: '#3498db' }}
            title={`Carbs: ${carbs}g`}
          />
        )}
        {fPct > 0 && (
          <div
            className="h-full"
            style={{ width: `${fPct}%`, backgroundColor: '#e74c3c' }}
            title={`Fat: ${fat}g`}
          />
        )}
      </div>
      <div className="flex items-center gap-2 text-[10px] font-bold tabular-nums flex-shrink-0">
        <span style={{ color: '#9b59b6' }}>{protein}p</span>
        <span style={{ color: '#3498db' }}>{carbs}c</span>
        <span style={{ color: '#e74c3c' }}>{fat}f</span>
      </div>
    </div>
  )
}