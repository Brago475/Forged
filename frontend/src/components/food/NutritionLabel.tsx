import { useState } from 'react'

/**
 * Standard nutrition label data. Any field can be undefined — those render as "—"
 * with a subtle hint that the data isn't available yet.
 */
export interface NutritionData {
  servingSize?: string
  servings?: number
  calories: number

  // Macros
  protein: number
  carbs: number
  fiber?: number
  sugar?: number
  fat: number
  saturatedFat?: number
  unsaturatedFat?: number

  // Micros (all optional until backend Tier 2)
  sodium?: number
  potassium?: number
  calcium?: number
  iron?: number
  magnesium?: number
  vitaminA?: number       // IU
  vitaminC?: number       // mg
  vitaminD?: number       // mcg
  vitaminB6?: number      // mg
  vitaminB12?: number     // mcg

  // Additional
  cholesterol?: number
  glycemicIndex?: 'Low' | 'Medium' | 'High' | null
  waterContent?: number   // percent
}

interface NutritionLabelProps {
  title: string
  subtitle?: string
  data: NutritionData
  /** Starts collapsed by default. Pass defaultOpen to start open. */
  defaultOpen?: boolean
  /** Hide the collapse toggle — always show everything. */
  alwaysOpen?: boolean
}

/**
 * FDA-style nutrition label, designed as a single scannable column.
 *
 * Layout priorities:
 *  - Calories big at the top
 *  - Macros with sub-breakdown (carbs → fiber/sugar, fat → sat/unsat) indented
 *  - Micros in a dense two-column grid
 *  - Additional metrics at the bottom
 *  - Missing values render as "—" with a hint
 */
export function NutritionLabel({ title, subtitle, data, defaultOpen = true, alwaysOpen = false }: NutritionLabelProps) {
  const [open, setOpen] = useState<boolean>(defaultOpen)

  const netCarbs = data.fiber != null ? Math.max(data.carbs - data.fiber, 0) : undefined
  const isOpen = alwaysOpen || open

  return (
    <div className="bg-forged-bg border border-forged-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => !alwaysOpen && setOpen(!open)}
        disabled={alwaysOpen}
        className={`w-full flex items-center justify-between px-4 py-3 text-left
          ${!alwaysOpen ? 'hover:bg-forged-surface2/50' : ''} transition-colors`}
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-forged-text truncate">{title}</h3>
          {subtitle && <p className="text-[10px] text-forged-text2 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          <span className="text-base font-black text-forged-purple tabular-nums">{Math.round(data.calories)}</span>
          <span className="text-[10px] text-forged-text2 font-bold">cal</span>
          {!alwaysOpen && (
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={`text-forged-text2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4">
          {/* Serving info */}
          {(data.servingSize || data.servings) && (
            <div className="pb-2 mb-2 border-b border-forged-border text-[10px] text-forged-text2">
              {data.servings && <span>Servings: <span className="font-bold text-forged-text">{data.servings}</span></span>}
              {data.servings && data.servingSize && <span className="mx-1">·</span>}
              {data.servingSize && <span>Size: <span className="font-bold text-forged-text">{data.servingSize}</span></span>}
            </div>
          )}

          {/* Big calories */}
          <div className="flex items-baseline justify-between border-b-2 border-forged-border pb-2 mb-2">
            <span className="text-xs font-black text-forged-text uppercase tracking-wider">Calories</span>
            <span className="text-3xl font-black text-forged-text tabular-nums">{Math.round(data.calories)}</span>
          </div>

          {/* MACRONUTRIENTS header */}
          <SectionHeader label="Macronutrients" />

          <LabelRow label="Protein" value={data.protein} unit="g" bold />

          <LabelRow label="Carbohydrates" value={data.carbs} unit="g" bold />
          <LabelRow label="Fiber" value={data.fiber} unit="g" indent />
          <LabelRow label="Sugar" value={data.sugar} unit="g" indent />
          {netCarbs != null && (
            <LabelRow label="Net Carbs" value={netCarbs} unit="g" indent hint="carbs − fiber" />
          )}

          <LabelRow label="Fat" value={data.fat} unit="g" bold />
          <LabelRow label="Saturated Fat" value={data.saturatedFat} unit="g" indent />
          <LabelRow label="Unsaturated Fat" value={data.unsaturatedFat} unit="g" indent />

          {/* MICRONUTRIENTS header */}
          <SectionHeader label="Micronutrients" />
          <div className="grid grid-cols-2 gap-x-3">
            <LabelRow label="Sodium" value={data.sodium} unit="mg" compact />
            <LabelRow label="Potassium" value={data.potassium} unit="mg" compact />
            <LabelRow label="Calcium" value={data.calcium} unit="mg" compact />
            <LabelRow label="Iron" value={data.iron} unit="mg" compact />
            <LabelRow label="Magnesium" value={data.magnesium} unit="mg" compact />
            <LabelRow label="Vitamin A" value={data.vitaminA} unit="IU" compact />
            <LabelRow label="Vitamin C" value={data.vitaminC} unit="mg" compact />
            <LabelRow label="Vitamin D" value={data.vitaminD} unit="mcg" compact />
            <LabelRow label="Vitamin B6" value={data.vitaminB6} unit="mg" compact />
            <LabelRow label="Vitamin B12" value={data.vitaminB12} unit="mcg" compact />
          </div>

          {/* ADDITIONAL METRICS header */}
          <SectionHeader label="Additional" />
          <LabelRow label="Cholesterol" value={data.cholesterol} unit="mg" />
          {data.glycemicIndex !== undefined && (
            <LabelRow
              label="Glycemic Index"
              valueText={data.glycemicIndex ?? undefined}
              hint="estimated"
            />
          )}
          <LabelRow label="Water Content" value={data.waterContent} unit="%" />

          {/* Footnote */}
          <p className="text-[9px] text-forged-text2 italic mt-3 leading-relaxed">
            Values marked — are not yet tracked. Full data will auto-fill once food database integration is enabled.
          </p>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────
// SUBCOMPONENTS
// ──────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="border-t border-forged-border mt-2 pt-2 mb-1">
      <p className="text-[9px] font-black text-forged-text2 uppercase tracking-widest">{label}</p>
    </div>
  )
}

function LabelRow({ label, value, valueText, unit, indent, bold, compact, hint }: {
  label: string
  value?: number
  valueText?: string
  unit?: string
  indent?: boolean
  bold?: boolean
  compact?: boolean
  hint?: string
}) {
  const hasValue = valueText !== undefined || (value !== undefined && value !== null)
  const display: string = valueText !== undefined
    ? valueText
    : (value !== undefined && value !== null)
      ? `${fmt(value)}${unit ? ' ' + unit : ''}`
      : '—'

  return (
    <div className={`flex items-baseline justify-between ${compact ? 'py-0.5' : 'py-1'} ${indent ? 'pl-4' : ''} ${!indent && !compact ? 'border-b border-forged-border/40 last:border-0' : ''}`}>
      <span className={`text-[11px] ${bold ? 'font-black text-forged-text' : 'text-forged-text'}`}>
        {label}
        {hint && <span className="text-forged-text2 text-[9px] ml-1 italic">({hint})</span>}
      </span>
      <span
        className={`text-[11px] font-bold tabular-nums ${hasValue ? 'text-forged-text' : 'text-forged-text2/50'}`}
      >
        {display}
      </span>
    </div>
  )
}

function fmt(n: number): string {
  if (n === 0) return '0'
  if (n >= 100) return Math.round(n).toString()
  if (n >= 10) return n.toFixed(1).replace(/\.0$/, '')
  return n.toFixed(1).replace(/\.0$/, '')
}