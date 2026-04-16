interface MiniStatProps {
  label: string
  value: string
}

/**
 * Small stat box with a large value and tiny label.
 * Used in grids for quick data summaries.
 */
export function MiniStat({ label, value }: MiniStatProps) {
  return (
    <div className="bg-forged-bg border border-forged-border rounded-xl p-2.5 text-center">
      <p className="text-lg font-black text-forged-text tabular-nums">{value}</p>
      <p className="text-[8px] text-forged-text2 font-bold uppercase">{label}</p>
    </div>
  )
}