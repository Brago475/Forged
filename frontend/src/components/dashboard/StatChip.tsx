interface StatChipProps {
  label: string
  value: string
  unit: string
  accent?: boolean
}

/**
 * Small stat tile used in the progress preview grid.
 * `accent` colors the value green (used for weight lost).
 */
export function StatChip({ label, value, unit, accent }: StatChipProps) {
  return (
    <div className="bg-forged-bg border border-forged-border rounded-xl p-3 text-center hover:border-forged-purple/25 transition-all">
      <p className="text-[10px] text-forged-text2 font-bold uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-xl font-black tabular-nums mt-1 ${accent ? 'text-forged-green' : 'text-forged-text'}`}>
        {value}
      </p>
      <p className="text-[10px] text-forged-text2">{unit}</p>
    </div>
  )
}